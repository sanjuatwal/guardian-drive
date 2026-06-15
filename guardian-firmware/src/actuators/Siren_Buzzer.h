#pragma once

#include "Siren.h"

// Bench substitute for the 12V automotive siren: drives a 5V active buzzer
// directly from a GPIO. Swap for a relay-driven siren driver at install time
// without touching ThreatResponse or StateManager.
class SirenBuzzer : public Siren {
 public:
  bool begin() override;
  void on() override;
  void off() override;
  bool isOn() const override { return on_; }

 private:
  bool on_ = false;
};
