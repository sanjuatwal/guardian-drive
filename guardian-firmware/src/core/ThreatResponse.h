#pragma once

#include "StateManager.h"
#include "../actuators/Siren.h"

// Drives Layer 1 automatic theft-response actuators (siren) from the current
// device state. Logic only — talks to Siren through its interface so the
// bench buzzer can be swapped for a relay-driven siren without changes here.
class ThreatResponse {
 public:
  explicit ThreatResponse(Siren& siren);

  bool begin();

  // Call every loop iteration with the current device state. Drives the
  // siren output, including the intermittent warning-chirp pattern used for
  // kTheftCandidate (Section 7: "Door opened, owner/key not nearby -> warning
  // chirp only").
  void update(DeviceState state);

 private:
  Siren& siren_;
  unsigned long lastChirpToggleMs_ = 0;
  bool chirpOn_ = false;
};
