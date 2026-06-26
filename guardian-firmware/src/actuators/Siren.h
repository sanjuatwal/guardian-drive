#pragma once

class Siren {
 public:
  virtual ~Siren() = default;

  virtual bool begin() = 0;
  virtual void on() = 0;
  virtual void off() = 0;
  virtual bool isOn() const = 0;
};
