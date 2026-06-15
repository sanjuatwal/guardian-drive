#pragma once

#include "Alerts.h"

class AlertsWiFi : public Alerts {
 public:
  bool begin() override;
  bool sendEvent(const Event& evt) override;
};
