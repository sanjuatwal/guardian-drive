#pragma once

#include "Alerts.h"

class AlertsWiFi : public Alerts {
 public:
  bool begin() override;
  bool sendEvent(const Event& evt) override;
  bool checkFalseAlarm() override;
  bool checkSirenTrigger() override;
  bool gpsTrackingAlwaysOn() const { return gpsTrackingAlwaysOn_; }

 private:
  bool pendingSirenTrigger_ = false;
  bool gpsTrackingAlwaysOn_ = false;
};
