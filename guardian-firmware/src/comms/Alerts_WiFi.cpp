#include "Alerts_WiFi.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>

#include "config.h"

namespace {
constexpr int kWifiConnectAttempts = 20;
constexpr int kWifiConnectDelayMs = 500;
}  // namespace

bool AlertsWiFi::begin() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  for (int attempt = 0; attempt < kWifiConnectAttempts && WiFi.status() != WL_CONNECTED; attempt++) {
    delay(kWifiConnectDelayMs);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection failed");
    return false;
  }

  Serial.printf("WiFi connected. IP: %s\n", WiFi.localIP().toString().c_str());
  return true;
}

bool AlertsWiFi::sendEvent(const Event& evt) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/events");
  http.addHeader("Content-Type", "application/json");

  char body[256];
  snprintf(body, sizeof(body),
           "{\"device_id\":\"%s\",\"event_id\":%lu,\"sensor_type\":\"%s\","
           "\"severity\":%d,\"timestamp_ms\":%lu,\"payload\":\"%s\"}",
           DEVICE_ID, evt.event_id, evt.sensor_type, static_cast<int>(evt.severity),
           evt.timestamp_ms, evt.payload);

  const int httpCode = http.POST(body);
  http.end();

  return httpCode == 200;
}
