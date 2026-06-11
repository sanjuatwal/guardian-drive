#pragma once

#include <Arduino.h>
#include <Wire.h>

#include "IMUSensor.h"

class IMUSensorMPU6050 : public IMUSensor {
 public:
  explicit IMUSensorMPU6050(uint8_t i2cAddress = 0x68);

  bool begin() override;
  bool read(IMUReading& out) override;

 private:
  bool writeReg(uint8_t reg, uint8_t value);
  bool readRegs(uint8_t startReg, uint8_t* buffer, size_t len);

  uint8_t addr_;
};
