#include "IMUSensor_MPU6050.h"

#include <math.h>

namespace {
constexpr uint8_t kRegPwrMgmt1 = 0x6B;
constexpr uint8_t kRegAccelXoutH = 0x3B;
constexpr float kAccelScale = 16384.0f;  // +/-2g default
}  // namespace

IMUSensorMPU6050::IMUSensorMPU6050(uint8_t i2cAddress) : addr_(i2cAddress) {}

bool IMUSensorMPU6050::begin() {
  // Freenove ESP32-S3 common I2C pins: SDA=GPIO8, SCL=GPIO9
  Wire.begin(8, 9);
  delay(50);

  // Wake the MPU-6050 (sleep bit off)
  return writeReg(kRegPwrMgmt1, 0x00);
}

bool IMUSensorMPU6050::read(IMUReading& out) {
  uint8_t raw[14] = {0};
  if (!readRegs(kRegAccelXoutH, raw, sizeof(raw))) {
    return false;
  }

  const int16_t axRaw = (static_cast<int16_t>(raw[0]) << 8) | raw[1];
  const int16_t ayRaw = (static_cast<int16_t>(raw[2]) << 8) | raw[3];
  const int16_t azRaw = (static_cast<int16_t>(raw[4]) << 8) | raw[5];

  out.ax = static_cast<float>(axRaw) / kAccelScale;
  out.ay = static_cast<float>(ayRaw) / kAccelScale;
  out.az = static_cast<float>(azRaw) / kAccelScale;

  // Simple gravity-vector tilt estimate for bench testing.
  out.pitchDeg = atan2f(out.ax, sqrtf(out.ay * out.ay + out.az * out.az)) * 57.2958f;
  out.rollDeg = atan2f(out.ay, sqrtf(out.ax * out.ax + out.az * out.az)) * 57.2958f;

  return true;
}

bool IMUSensorMPU6050::writeReg(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(addr_);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool IMUSensorMPU6050::readRegs(uint8_t startReg, uint8_t* buffer, size_t len) {
  Wire.beginTransmission(addr_);
  Wire.write(startReg);
  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  const size_t readLen = Wire.requestFrom(static_cast<int>(addr_), static_cast<int>(len));
  if (readLen != len) {
    return false;
  }

  for (size_t i = 0; i < len; ++i) {
    buffer[i] = Wire.read();
  }
  return true;
}
