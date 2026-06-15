#pragma once

// Tracks the authorized-use modes from feature-document.md Section 9
// (Service Mode, Valet Mode, Tow Approval Mode). While any of these is
// active, tilt/movement events that would otherwise look like theft are
// suppressed instead of escalated.
class AuthorizedModes {
 public:
  bool isServiceModeActive() const { return serviceModeActive_; }
  bool isValetModeActive() const { return valetModeActive_; }
  bool isTowModeActive() const { return towModeActive_; }

  bool isAnyModeActive() const {
    return serviceModeActive_ || valetModeActive_ || towModeActive_;
  }

  void setServiceMode(bool active);
  void setValetMode(bool active);
  void setTowMode(bool active);

 private:
  bool serviceModeActive_ = false;
  bool valetModeActive_ = false;
  bool towModeActive_ = false;
};
