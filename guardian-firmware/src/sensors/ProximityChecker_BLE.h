#pragma once

#include "ProximityChecker.h"

// Real BLE owner-phone proximity (feature-document.md Section 12).
//
// The car unit (ESP32) is the BLE *peripheral*: it advertises the Guardian
// service and waits. The phone app is the BLE *central*: it scans for that
// service, connects when in range, and writes OWNER_AUTH_TOKEN to prove it is
// the owner's phone. A live, authenticated connection == owner phone nearby;
// the connection dropping (phone out of range) == owner phone away.
//
// Why this direction and not "phone advertises, ESP32 scans": iOS hides an
// app's advertised service UUID once the app is backgrounded (phone in
// pocket), so a generic scanner like the ESP32 can't see it. iOS handles
// background *scanning* well, so the phone scans and the car unit advertises.
//
// keyTagNearby() is still simulated here — the Guardian Key Tag is a separate
// ESP32-C3 device whose firmware does not exist yet (Section 12 / Week 6).
class ProximityCheckerBLE : public ProximityChecker {
 public:
  bool begin() override;
  bool ownerPhoneNearby() override;
  bool keyTagNearby() override { return keyTagNearby_; }

  // Bench overrides so the theft logic stays testable without a built app.
  // 'p' forces phone-present regardless of the real BLE link; 'k' simulates
  // the not-yet-built Key Tag.
  void setPhoneNearby(bool nearby);
  void setKeyTagNearby(bool nearby);

  // Invoked from the BLE server/characteristic callbacks (see .cpp).
  void onCentralConnected();
  void onCentralDisconnected();
  void onAuthenticated();

 private:
  volatile bool connected_ = false;
  volatile bool authenticated_ = false;
  bool phoneOverride_ = false;
  bool keyTagNearby_ = false;
};
