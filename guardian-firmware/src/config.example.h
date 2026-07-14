#pragma once

// Copy this file to config.h and fill in your real values.
// config.h is gitignored — never commit real WiFi credentials.

#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// Backend API base URL, e.g. http://192.168.1.50:8000
#define BACKEND_URL "http://192.168.1.50:8000"

#define DEVICE_ID "guardian-dev-01"

// --- SIM7670G UART + power (Waveshare ESP32-S3-SIM7670G board) ---
// GPIO17 = ESP RX ← SIM TX, GPIO18 = ESP TX → SIM RX, GPIO33 = modem power enable
#define SIM_UART_RX  17
#define SIM_UART_TX  18
#define SIM_PWRKEY   33

// --- BLE owner-phone proximity (feature-document.md Section 12) ---
// The car unit advertises this service; the phone app scans for it, connects,
// and writes OWNER_AUTH_TOKEN to prove it is the owner's phone. These three
// values MUST match the app's src/ble/guardianBle.ts exactly.
#define BLE_DEVICE_NAME "Guardian-Drive-01"
#define GUARDIAN_SERVICE_UUID "6b2f0001-9d6f-4c2a-9b3a-2a4f9c1e7a10"
#define GUARDIAN_AUTH_CHAR_UUID "6b2f0002-9d6f-4c2a-9b3a-2a4f9c1e7a10"
#define OWNER_AUTH_TOKEN "guardian-dev-owner-token"
