#pragma once

#include "core/EventLogger.h"

class Alerts {
 public:
  virtual ~Alerts() = default;

  virtual bool begin() = 0;
  virtual bool sendEvent(const Event& evt) = 0;
};
