#include "Siren_Buzzer.h"

#include <Arduino.h>

namespace {
// Freenove ESP32-S3: GPIO4 is free (I2C uses 8/9). Active buzzer module:
// VCC -> 5V, GND -> GND, I/O -> this pin.
constexpr int kSirenPin = 4;
}  // namespace

bool SirenBuzzer::begin() {
  pinMode(kSirenPin, OUTPUT);
  digitalWrite(kSirenPin, LOW);
  on_ = false;
  return true;
}

void SirenBuzzer::on() {
  digitalWrite(kSirenPin, HIGH);
  on_ = true;
}

void SirenBuzzer::off() {
  digitalWrite(kSirenPin, LOW);
  on_ = false;
}
