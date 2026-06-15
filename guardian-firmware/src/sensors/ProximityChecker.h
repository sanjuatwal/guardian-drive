#pragma once

// Interface for owner-proximity detection (feature-document.md Section 12):
// is the owner's phone and/or Guardian Key Tag near the vehicle. Drivers
// implement this over BLE RSSI/UWB; ProximityCheckerStub simulates presence
// for bench testing before that hardware is wired.
class ProximityChecker {
 public:
  virtual ~ProximityChecker() = default;

  virtual bool begin() = 0;
  virtual bool ownerPhoneNearby() = 0;
  virtual bool keyTagNearby() = 0;
};
