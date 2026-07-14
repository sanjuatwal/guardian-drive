#include "Siren_Buzzer.h"

#include <Arduino.h>

namespace {
// Waveshare ESP32-S3-SIM7670G: GPIO21 is free (GPIO4 = SDMMC_CMD on this board).
// Active buzzer: VCC -> 3.3V, GND -> GND, I/O -> this pin.
constexpr int kSirenPin = 1;
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
