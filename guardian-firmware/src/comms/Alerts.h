#pragma once

#include "core/EventLogger.h"

class Alerts {
 public:
  virtual ~Alerts() = default;

  virtual bool begin() = 0;
  virtual bool sendEvent(const Event& evt) = 0;

  // Returns true if the backend has a pending "siren_off" (owner tapped
  // "False Alarm" / "It's me — Not a theft") command for this device.
  virtual bool checkFalseAlarm() = 0;

  // Returns true if the backend has a pending "siren_on" (owner triggered
  // siren remotely from the app). Consumes the flag on read.
  virtual bool checkSirenTrigger() = 0;
};
