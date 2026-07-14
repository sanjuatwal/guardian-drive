#pragma once

#include <Arduino.h>

struct GPSReading {
  bool valid;
  float latitude;
  float longitude;
  float altitudeM;
  float speedKmh;
  char utcTime[20];  // "YYYYMMDDHHMMSS.sss"
};

class GNSS_SIM7670G {
 public:
  bool begin();
  bool read(GPSReading& out);
  bool isModemAlive();

 private:
  bool powerOn();
  bool sendAT(const char* cmd, const char* expected, unsigned long timeoutMs = 3000);
  String readResponse(unsigned long timeoutMs);
};
