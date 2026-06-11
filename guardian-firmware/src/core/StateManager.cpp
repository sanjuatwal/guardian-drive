#include "StateManager.h"

#include <Arduino.h>

StateManager::StateManager() : state_(DeviceState::kNormal) {}

void StateManager::transitionToSuspicious() {
  if (state_ != DeviceState::kSuspicious) {
    state_ = DeviceState::kSuspicious;
    Serial.println("STATE: -> SUSPICIOUS");
  }
}

void StateManager::transitionToTheftCandidate() {
  if (state_ != DeviceState::kTheftCandidate) {
    state_ = DeviceState::kTheftCandidate;
    Serial.println("STATE: -> THEFT_CANDIDATE");
  }
}

void StateManager::transitionToTheftMode() {
  if (state_ != DeviceState::kTheftMode) {
    state_ = DeviceState::kTheftMode;
    Serial.println("STATE: -> THEFT_MODE (siren + tracking active)");
  }
}

void StateManager::transitionToNormal() {
  if (state_ != DeviceState::kNormal) {
    state_ = DeviceState::kNormal;
    Serial.println("STATE: -> NORMAL");
  }
}
