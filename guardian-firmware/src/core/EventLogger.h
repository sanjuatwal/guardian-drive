#pragma once

#include <stdint.h>

enum class EventSeverity {
  kInfo = 0,
  kWarning = 1,
  kHigh = 2,
};

struct Event {
  uint32_t event_id;
  uint32_t timestamp_ms;
  const char* sensor_type;
  EventSeverity severity;
  const char* payload;
};

class EventLogger {
 public:
  EventLogger();

  // Append and emit event to serial.
  void log(const Event& evt);

  // Get next sequence ID for new events.
  uint32_t nextEventId();

 private:
  uint32_t eventSequence_;
};
