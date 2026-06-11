#include "EventLogger.h"

#include <Arduino.h>

EventLogger::EventLogger() : eventSequence_(0) {}

void EventLogger::log(const Event& evt) {
  Serial.printf(
      "EVENT|event_id=%lu|sensor_type=%s|severity=%d|timestamp_ms=%lu|payload=%s\n",
      evt.event_id,
      evt.sensor_type,
      static_cast<int>(evt.severity),
      evt.timestamp_ms,
      evt.payload);
}

uint32_t EventLogger::nextEventId() {
  return ++eventSequence_;
}
