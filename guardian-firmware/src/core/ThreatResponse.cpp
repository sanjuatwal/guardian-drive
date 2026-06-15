#include "ThreatResponse.h"

#include <Arduino.h>

namespace {
constexpr unsigned long kChirpOnMs = 150;
constexpr unsigned long kChirpOffMs = 1850;
}  // namespace

ThreatResponse::ThreatResponse(Siren& siren) : siren_(siren) {}

bool ThreatResponse::begin() {
  return siren_.begin();
}

void ThreatResponse::update(DeviceState state) {
  switch (state) {
    case DeviceState::kTheftMode:
      chirpOn_ = false;
      if (!siren_.isOn()) {
        siren_.on();
        Serial.println("THREAT RESPONSE: siren ON (theft mode)");
      }
      break;

    case DeviceState::kTheftCandidate: {
      const unsigned long now = millis();
      const unsigned long elapsed = now - lastChirpToggleMs_;
      if (chirpOn_ && elapsed >= kChirpOnMs) {
        siren_.off();
        chirpOn_ = false;
        lastChirpToggleMs_ = now;
      } else if (!chirpOn_ && elapsed >= kChirpOffMs) {
        siren_.on();
        chirpOn_ = true;
        lastChirpToggleMs_ = now;
        Serial.println("THREAT RESPONSE: warning chirp (theft candidate)");
      }
      break;
    }

    case DeviceState::kNormal:
    case DeviceState::kSuspicious:
    default:
      chirpOn_ = false;
      if (siren_.isOn()) {
        siren_.off();
        Serial.println("THREAT RESPONSE: siren OFF");
      }
      break;
  }
}
