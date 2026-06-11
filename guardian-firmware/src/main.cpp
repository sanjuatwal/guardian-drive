#include <Arduino.h>
#include <Wire.h>
#include <math.h>

#include "sensors/IMUSensor.h"
#include "sensors/IMUSensor_MPU6050.h"
#include "core/EventLogger.h"
#include "core/StateManager.h"

IMUSensorMPU6050 imu;
EventLogger eventLogger;
StateManager stateManager;

namespace {
constexpr int kBaselineSampleCount = 50;
constexpr float kTiltAlertThresholdDeg = 8.0f;
constexpr int kTiltAlertConsecutiveSamples = 3;
}

int baselineSamples = 0;
float baselinePitchSum = 0.0f;
float baselineRollSum = 0.0f;
float baselinePitchDeg = 0.0f;
float baselineRollDeg = 0.0f;
bool baselineReady = false;
int tiltBreachCount = 0;
bool tiltAlertActive = false;
bool imuOnline = false;

void resetBaseline() {
  baselineSamples = 0;
  baselinePitchSum = 0.0f;
  baselineRollSum = 0.0f;
  baselinePitchDeg = 0.0f;
  baselineRollDeg = 0.0f;
  baselineReady = false;
  tiltBreachCount = 0;
  tiltAlertActive = false;
  Serial.println("Baseline reset: recalibrating...");
}

void emitTiltEvent(float tiltDelta, float pitchDeg, float rollDeg) {
  static char payload[128];
  snprintf(payload, sizeof(payload),
           "delta_deg:%.2f,pitch_deg:%.2f,roll_deg:%.2f",
           tiltDelta, pitchDeg, rollDeg);

  Event evt;
  evt.event_id = eventLogger.nextEventId();
  evt.sensor_type = "imu_tilt";
  evt.severity = EventSeverity::kHigh;
  evt.timestamp_ms = millis();
  evt.payload = payload;

  eventLogger.log(evt);
  stateManager.transitionToSuspicious();
}

bool readImu(IMUReading& out) {
  return imu.read(out);
}

void scanI2C() {
  Serial.println("I2C scan starting...");
  Wire.begin(8, 9);

  int found = 0;
  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("I2C device found at address 0x%02X\n", address);
      found++;
    }
  }

  if (found == 0) {
    Serial.println("I2C scan: no devices found (check wiring/power)");
  } else {
    Serial.printf("I2C scan complete: %d device(s) found\n", found);
  }
}

void handleSerialCommands() {
  while (Serial.available() > 0) {
    const char cmd = static_cast<char>(Serial.read());
    if (cmd == 'r' || cmd == 'R') {
      resetBaseline();
    }
  }
}

void processReading(const IMUReading& r) {
  if (!baselineReady) {
    baselinePitchSum += r.pitchDeg;
    baselineRollSum += r.rollDeg;
    baselineSamples++;

    if (baselineSamples >= kBaselineSampleCount) {
      baselinePitchDeg = baselinePitchSum / static_cast<float>(baselineSamples);
      baselineRollDeg = baselineRollSum / static_cast<float>(baselineSamples);
      baselineReady = true;

      Serial.printf(
          "Park baseline set: pitch=%.2f roll=%.2f (samples=%d)\n",
          baselinePitchDeg,
          baselineRollDeg,
          baselineSamples);
    } else {
      Serial.printf(
          "Calibrating baseline... %d/%d | pitch=%.2f roll=%.2f\n",
          baselineSamples,
          kBaselineSampleCount,
          r.pitchDeg,
          r.rollDeg);
    }
    return;
  }

  const float pitchDelta = fabsf(r.pitchDeg - baselinePitchDeg);
  const float rollDelta = fabsf(r.rollDeg - baselineRollDeg);
  const float tiltDelta = (pitchDelta > rollDelta) ? pitchDelta : rollDelta;

  Serial.printf(
      "ACC[g] ax=%.3f ay=%.3f az=%.3f | tilt pitch=%.2f roll=%.2f | delta=%.2f\n",
      r.ax,
      r.ay,
      r.az,
      r.pitchDeg,
      r.rollDeg,
      tiltDelta);

  if (tiltDelta > kTiltAlertThresholdDeg) {
    tiltBreachCount++;
  } else {
    tiltBreachCount = 0;
    tiltAlertActive = false;
  }

  if (!tiltAlertActive && tiltBreachCount >= kTiltAlertConsecutiveSamples) {
    tiltAlertActive = true;
    Serial.printf(
        "SUSPICIOUS TILT: delta=%.2f deg (threshold=%.2f deg, consecutive=%d)\n",
        tiltDelta,
        kTiltAlertThresholdDeg,
        tiltBreachCount);
    emitTiltEvent(tiltDelta, r.pitchDeg, r.rollDeg);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Guardian Drive — ESP32-S3 online.");

  scanI2C();

  imuOnline = imu.begin();
  if (imuOnline) {
    Serial.println("MPU-6050 init: OK");
  } else {
    Serial.println("MPU-6050 init: FAIL (check wiring/power)");
  }
}

void loop() {
  handleSerialCommands();

  if (!imuOnline) {
    // Keep retrying so wiring fixes can be checked live without reflashing.
    scanI2C();
    imuOnline = imu.begin();
    if (imuOnline) {
      Serial.println("MPU-6050 init: OK");
    } else {
      Serial.println("MPU-6050 init: FAIL (check wiring/power)");
    }
    delay(2000);
    return;
  }

  IMUReading r;
  if (readImu(r)) {
    processReading(r);
  } else {
    Serial.println("IMU read failed");
  }

  delay(300);
}
