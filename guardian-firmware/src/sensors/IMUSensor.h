#pragma once

struct IMUReading {
  float ax;
  float ay;
  float az;
  float pitchDeg;
  float rollDeg;
};

class IMUSensor {
 public:
  virtual ~IMUSensor() = default;

  virtual bool begin() = 0;
  virtual bool read(IMUReading& out) = 0;
};
