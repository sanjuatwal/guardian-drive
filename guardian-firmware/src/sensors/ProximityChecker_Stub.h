#pragma once

#include "ProximityChecker.h"

// Bench stub: no BLE phone/Key Tag hardware wired yet (Week 6 work).
// Presence is simulated and toggled via serial commands so the
// authorization/theft logic can be tested now. Swap for a BLE RSSI driver
// later without touching the logic that consumes this interface.
class ProximityCheckerStub : public ProximityChecker {
 public:
  bool begin() override;
  bool ownerPhoneNearby() override { return phoneNearby_; }
  bool keyTagNearby() override { return keyTagNearby_; }

  void setPhoneNearby(bool nearby);
  void setKeyTagNearby(bool nearby);

 private:
  bool phoneNearby_ = true;
  bool keyTagNearby_ = true;
};
