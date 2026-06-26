#include "ProximityChecker_Stub.h"

#include <Arduino.h>

bool ProximityCheckerStub::begin() {
  return true;
}

void ProximityCheckerStub::setPhoneNearby(bool nearby) {
  phoneNearby_ = nearby;
  Serial.println(nearby ? "SIM: owner phone now NEARBY" : "SIM: owner phone now AWAY");
}

void ProximityCheckerStub::setKeyTagNearby(bool nearby) {
  keyTagNearby_ = nearby;
  Serial.println(nearby ? "SIM: Guardian Key Tag now NEARBY" : "SIM: Guardian Key Tag now AWAY");
}
