#pragma once

#include "ProximityChecker.h"

// Bench stub: no BLE phone/Key Tag hardware wired yet (Week 6 work).
// Presence is simulated and toggled via serial commands so the
// authorization/theft logic can be tested now. Swap for a BLE RSSI driver
// later without touching the logic that consumes this interface.
//
// Defaults to "not nearby" for both — matches the no-phone/no-key-tag THEFT
// row of the Section 12 truth table, so the auto-trigger path is live by
// default. Toggle with 'p' / 'k' to test the authorized-presence path.
class ProximityCheckerStub : public ProximityChecker {
 public:
  bool begin() override;
  bool ownerPhoneNearby() override { return phoneNearby_; }
  bool keyTagNearby() override { return keyTagNearby_; }

  void setPhoneNearby(bool nearby);
  void setKeyTagNearby(bool nearby);

 private:
  bool phoneNearby_ = false;
  bool keyTagNearby_ = false;
};
