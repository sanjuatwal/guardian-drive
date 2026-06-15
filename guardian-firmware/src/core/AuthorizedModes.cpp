#include "AuthorizedModes.h"

#include <Arduino.h>

void AuthorizedModes::setServiceMode(bool active) {
  serviceModeActive_ = active;
  Serial.println(active ? "MODE: Service Mode ON" : "MODE: Service Mode OFF");
}

void AuthorizedModes::setValetMode(bool active) {
  valetModeActive_ = active;
  Serial.println(active ? "MODE: Valet Mode ON" : "MODE: Valet Mode OFF");
}

void AuthorizedModes::setTowMode(bool active) {
  towModeActive_ = active;
  Serial.println(active ? "MODE: Tow Approval Mode ON" : "MODE: Tow Approval Mode OFF");
}
