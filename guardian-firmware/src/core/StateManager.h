#pragma once

enum class DeviceState {
  kNormal = 0,           // Parked, no alerts.
  kSuspicious = 1,       // Tilt/unlock signal detected, not yet confirmed.
  kTheftCandidate = 2,   // Multiple signals or owner non-response, ready to escalate.
  kTheftMode = 3,        // Confirmed theft, siren, tracking active.
};

class StateManager {
 public:
  StateManager();

  DeviceState currentState() const { return state_; }

  // Transitions.
  void transitionToSuspicious();
  void transitionToTheftCandidate();
  void transitionToTheftMode();
  void transitionToNormal();

  // Helpers.
  bool isTheftMode() const { return state_ == DeviceState::kTheftMode; }
  bool isSuspicious() const { return state_ == DeviceState::kSuspicious; }

 private:
  DeviceState state_;
};
