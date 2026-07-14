#include <Arduino.h>
#include <Wire.h>
#include <math.h>

#include "sensors/IMUSensor.h"
#include "sensors/IMUSensor_MPU6050.h"
#include "core/EventLogger.h"
#include "core/StateManager.h"
#include "core/ThreatResponse.h"
#include "core/AuthorizedModes.h"
#include "actuators/Siren_Buzzer.h"
#include "sensors/ProximityChecker_BLE.h"
#include "comms/Alerts_WiFi.h"
#include "gps/GNSS_SIM7670G.h"

IMUSensorMPU6050 imu;
EventLogger eventLogger;
StateManager stateManager;
SirenBuzzer siren;
ThreatResponse threatResponse(siren);
AuthorizedModes authorizedModes;
ProximityCheckerBLE proximityChecker;
AlertsWiFi alerts;
GNSS_SIM7670G gnss;

namespace {
constexpr int kBaselineSampleCount = 50;
constexpr float kTiltAlertThresholdDeg = 8.0f;
constexpr float kTiltReleaseThresholdDeg = 5.0f;  // dead-band floor: below this, fully reset
constexpr int kTiltAlertConsecutiveSamples = 3;
constexpr float kBaselineStableMagnitudeToleranceG = 0.05f;  // only calibrate while at rest
constexpr float kImpactThresholdG = 0.5f;
constexpr unsigned long kImpactCooldownMs = 1000;
constexpr unsigned long kFalseAlarmPollIntervalMs = 3000;
constexpr unsigned long kGpsPollIntervalMs = 20000;  // poll GNSS every 20 s
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
unsigned long lastImpactMs = 0;
unsigned long lastFalseAlarmPollMs = 0;
unsigned long lastGpsPollMs = 0;
bool gnssOnline = false;

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

// Section 9 + Section 12: with no authorized mode active, a suspicious tilt
// is resolved against the phone/Key Tag truth table:
//  - owner/key present  -> not theft, but ambiguous (towing/jacking/service)
//                           -> prompt owner to enable Tow/Service mode
//  - owner/key absent    -> no phone, no key tag, suspicious movement
//                           -> Layer 1 automatic THEFT_MODE, siren fires now
void evaluateTiltEscalation() {
  if (authorizedModes.isAnyModeActive()) {
    Serial.println("INFO: tilt detected during an authorized mode (service/valet/tow) — suppressed.");
    return;
  }

  const bool ownerPresent = proximityChecker.ownerPhoneNearby() || proximityChecker.keyTagNearby();
  if (ownerPresent) {
    Event evt;
    evt.event_id = eventLogger.nextEventId();
    evt.sensor_type = "tilt_mode_advice";
    evt.severity = EventSeverity::kInfo;
    evt.timestamp_ms = millis();
    evt.payload = "owner_present:true,service_mode:false,valet_mode:false,tow_mode:false";

    eventLogger.log(evt);
    alerts.sendEvent(evt);
    Serial.println(
        "NOTICE: Vehicle tilt detected while you're nearby. If this is expected "
        "(towing, jacking, service), turn on Tow Approval or Service Mode to avoid a false theft alert.");
    return;
  }

  // No phone, no key tag, no authorized mode + tilt -> THEFT (Section 12).
  Event evt;
  evt.event_id = eventLogger.nextEventId();
  evt.sensor_type = "theft_auto_trigger";
  evt.severity = EventSeverity::kHigh;
  evt.timestamp_ms = millis();
  evt.payload = "reason:tilt,owner_present:false,key_tag_present:false";

  eventLogger.log(evt);
  alerts.sendEvent(evt);
  Serial.println("THEFT: no phone/key tag nearby + tilt detected — triggering Theft Mode automatically.");
  stateManager.transitionToTheftMode();
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
  alerts.sendEvent(evt);
  stateManager.transitionToSuspicious();
  evaluateTiltEscalation();
}

bool readImu(IMUReading& out) {
  return imu.read(out);
}

void emitImpactEvent(float magnitudeG, float deltaG) {
  static char payload[128];
  snprintf(payload, sizeof(payload),
           "magnitude_g:%.2f,delta_g:%.2f",
           magnitudeG, deltaG);

  Event evt;
  evt.event_id = eventLogger.nextEventId();
  evt.sensor_type = "impact";
  evt.severity = EventSeverity::kWarning;
  evt.timestamp_ms = millis();
  evt.payload = payload;

  eventLogger.log(evt);
  alerts.sendEvent(evt);
  Serial.printf(
      "DAMAGE ALERT: impact detected (magnitude=%.2fg, delta=%.2fg). "
      "Not theft unless followed by door/start/move.\n",
      magnitudeG, deltaG);
}

// Poll the backend command queue for siren_off (false alarm) and siren_on
// (remote trigger from app). Both are parsed from one HTTP call inside
// checkFalseAlarm() so neither consumes the other's queued command.
void checkRemoteCommands() {
  const unsigned long now = millis();
  if (now - lastFalseAlarmPollMs < kFalseAlarmPollIntervalMs) {
    return;
  }
  lastFalseAlarmPollMs = now;

  const bool falseAlarm = alerts.checkFalseAlarm();
  const bool sirenTrigger = alerts.checkSirenTrigger();

  if (falseAlarm && stateManager.currentState() != DeviceState::kNormal) {
    Serial.println("APP: False alarm — silencing siren, returning to NORMAL.");
    stateManager.transitionToNormal();
  }
  if (sirenTrigger && stateManager.currentState() != DeviceState::kTheftMode) {
    Serial.println("APP: Remote siren trigger — entering THEFT_MODE.");
    stateManager.transitionToTheftMode();
  }
}

void scanI2C() {
  Serial.println("I2C scan starting...");
  Wire.begin(13, 14);  // Waveshare ESP32-S3-SIM7670G: SDA=GPIO13, SCL=GPIO14

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
    switch (cmd) {
      case 'r':
      case 'R':
        resetBaseline();
        break;
      case 'c':
      case 'C':
        Serial.println("BENCH: forcing THEFT_CANDIDATE (warning chirp)");
        stateManager.transitionToTheftCandidate();
        break;
      case 't':
      case 'T':
        Serial.println("BENCH: forcing THEFT_MODE (siren)");
        stateManager.transitionToTheftMode();
        break;
      case 'n':
      case 'N':
        Serial.println("BENCH: forcing NORMAL (siren silenced)");
        stateManager.transitionToNormal();
        break;
      case 's':
      case 'S':
        authorizedModes.setServiceMode(!authorizedModes.isServiceModeActive());
        break;
      case 'v':
      case 'V':
        authorizedModes.setValetMode(!authorizedModes.isValetModeActive());
        break;
      case 'w':
      case 'W':
        authorizedModes.setTowMode(!authorizedModes.isTowModeActive());
        break;
      case 'p':
      case 'P':
        proximityChecker.setPhoneNearby(!proximityChecker.ownerPhoneNearby());
        break;
      case 'k':
      case 'K':
        proximityChecker.setKeyTagNearby(!proximityChecker.keyTagNearby());
        break;
      default:
        break;
    }
  }
}

void processReading(const IMUReading& r) {
  const float accelMagnitude = sqrtf(r.ax * r.ax + r.ay * r.ay + r.az * r.az);

  // All-zero reading means the MPU-6050 lost I2C contact (loose wire after
  // tilting is the common cause) — a real sensor always reads ~1g of gravity.
  // Count consecutive bad reads; after 5 in a row, force a re-init so the
  // sensor recovers automatically when the connection is restored.
  static int zeroReadCount = 0;
  if (accelMagnitude < 0.1f) {
    zeroReadCount++;
    Serial.printf("IMU: near-zero magnitude (%d consecutive) — I2C fault or sensor sleeping\n", zeroReadCount);
    if (zeroReadCount >= 5) {
      Serial.println("IMU: too many bad reads — marking offline for re-init");
      imuOnline = false;
      zeroReadCount = 0;
    }
    return;
  }
  zeroReadCount = 0;

  const float accelMagnitudeDelta = fabsf(accelMagnitude - 1.0f);
  const unsigned long now = millis();

  if (accelMagnitudeDelta > kImpactThresholdG && (now - lastImpactMs) > kImpactCooldownMs) {
    lastImpactMs = now;
    emitImpactEvent(accelMagnitude, accelMagnitudeDelta);
  }

  if (!baselineReady) {
    // Only count this sample toward the baseline if the device is actually
    // at rest — otherwise handling/positioning during calibration bakes a
    // skewed zero-point into the baseline (root cause of inconsistent
    // tilt triggers across reboots).
    if (accelMagnitudeDelta > kBaselineStableMagnitudeToleranceG) {
      Serial.printf(
          "Calibrating baseline... device not stable (accel delta=%.3fg), sample discarded | pitch=%.2f roll=%.2f\n",
          accelMagnitudeDelta,
          r.pitchDeg,
          r.rollDeg);
      return;
    }

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

  // Three-way hysteresis: a single noisy dip back under the alert threshold
  // should not wipe out progress toward the consecutive-sample requirement.
  // Only a clear return below the release threshold counts as "back to normal".
  const char* zone;
  if (tiltDelta > kTiltAlertThresholdDeg) {
    tiltBreachCount++;
    zone = "ALERT";
  } else if (tiltDelta > kTiltReleaseThresholdDeg) {
    zone = "HOLD";
  } else {
    tiltBreachCount = 0;
    tiltAlertActive = false;
    zone = "RESET";
  }

  Serial.printf(
      "ACC[g] ax=%.3f ay=%.3f az=%.3f | tilt pitch=%.2f roll=%.2f | delta=%.2f zone=%s breachCount=%d\n",
      r.ax,
      r.ay,
      r.az,
      r.pitchDeg,
      r.rollDeg,
      tiltDelta,
      zone,
      tiltBreachCount);

  if (!tiltAlertActive && tiltBreachCount >= kTiltAlertConsecutiveSamples) {
    tiltAlertActive = true;
    Serial.printf(
        "SUSPICIOUS TILT: delta=%.2f deg (threshold=%.2f deg, consecutive=%d)\n",
        tiltDelta,
        kTiltAlertThresholdDeg,
        tiltBreachCount);
    // Don't re-emit if theft mode is already active — one alert is enough.
    if (stateManager.currentState() != DeviceState::kTheftMode) {
      emitTiltEvent(tiltDelta, r.pitchDeg, r.rollDeg);
    }
  }
}

void pollGPS() {
  const DeviceState state = stateManager.currentState();
  const bool alwaysOn = alerts.gpsTrackingAlwaysOn();

  // Default: only track during suspicious/theft. If always-on, track in any state.
  if (!alwaysOn && state == DeviceState::kNormal) return;

  // Poll faster while actively in theft mode
  const unsigned long interval =
      (state == DeviceState::kTheftMode) ? 5000UL : kGpsPollIntervalMs;

  const unsigned long now = millis();
  if (now - lastGpsPollMs < interval) return;
  lastGpsPollMs = now;

  GPSReading gps;
  if (!gnss.read(gps)) return;

  static char payload[128];
  snprintf(payload, sizeof(payload),
           "lat:%.6f,lon:%.6f,alt_m:%.1f,speed_kmh:%.1f,utc:%s",
           gps.latitude, gps.longitude, gps.altitudeM, gps.speedKmh, gps.utcTime);

  Event evt;
  evt.event_id = eventLogger.nextEventId();
  evt.sensor_type = "gps_location";
  evt.severity = (state == DeviceState::kTheftMode) ? EventSeverity::kHigh : EventSeverity::kInfo;
  evt.timestamp_ms = now;
  evt.payload = payload;

  eventLogger.log(evt);
  alerts.sendEvent(evt);
  Serial.printf("[GPS] Fix: lat=%.6f lon=%.6f alt=%.1fm speed=%.1fkm/h utc=%s\n",
                gps.latitude, gps.longitude, gps.altitudeM, gps.speedKmh, gps.utcTime);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("Guardian Drive — ESP32-S3 online.");

  threatResponse.begin();
  proximityChecker.begin();
  alerts.begin();
  Serial.println("Siren bench commands: 'c'=theft candidate (chirp), 't'=theft mode (siren), 'n'=normal (silence)");
  Serial.println("Mode bench commands: 's'=toggle service mode, 'v'=toggle valet mode, 'w'=toggle tow mode");
  Serial.println("Proximity: phone presence is now driven by real BLE link. 'p'=force phone override, 'k'=toggle simulated key tag");
  Serial.println("Defaults: no phone connected + no key tag — suspicious tilt auto-triggers Theft Mode (Section 12)");

  gnssOnline = gnss.begin();
  if (gnssOnline) {
    Serial.println("SIM7670G GNSS init: OK");
  } else {
    Serial.println("SIM7670G GNSS init: FAIL (modem may need more time — will retry)");
  }

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
  threatResponse.update(stateManager.currentState());
  checkRemoteCommands();

  if (!gnssOnline) {
    // Only retry GPS init every 30s — begin() already spends ~10s probing
    static unsigned long lastGnssTryMs = 0;
    const unsigned long now2 = millis();
    if (now2 - lastGnssTryMs >= 30000) {
      lastGnssTryMs = now2;
      gnssOnline = gnss.begin();
    }
  } else {
    pollGPS();
  }

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
