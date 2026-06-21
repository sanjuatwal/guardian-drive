#include "ProximityChecker_BLE.h"

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

#include "../config.h"

namespace {
// The BLE callbacks below are free-standing classes the ESP32 BLE stack owns,
// so they reach the single ProximityCheckerBLE instance through this pointer.
ProximityCheckerBLE* g_self = nullptr;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* /*server*/) override {
    if (g_self) g_self->onCentralConnected();
  }
  void onDisconnect(BLEServer* /*server*/) override {
    if (g_self) g_self->onCentralDisconnected();
    // Re-advertise so the phone (or a fresh central) can reconnect.
    BLEDevice::startAdvertising();
  }
};

class AuthCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* characteristic) override {
    if (!g_self) return;
    const std::string value = characteristic->getValue();
    if (value == std::string(OWNER_AUTH_TOKEN)) {
      g_self->onAuthenticated();
    } else {
      Serial.println("BLE: central wrote a bad auth token — not counted as owner phone.");
    }
  }
};
}  // namespace

bool ProximityCheckerBLE::begin() {
  g_self = this;

  BLEDevice::init(BLE_DEVICE_NAME);
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService* service = server->createService(GUARDIAN_SERVICE_UUID);
  BLECharacteristic* authChar = service->createCharacteristic(
      GUARDIAN_AUTH_CHAR_UUID, BLECharacteristic::PROPERTY_WRITE);
  authChar->setCallbacks(new AuthCallbacks());
  service->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(GUARDIAN_SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.printf("BLE proximity: advertising \"%s\", waiting for owner phone...\n", BLE_DEVICE_NAME);
  return true;
}

bool ProximityCheckerBLE::ownerPhoneNearby() {
  return phoneOverride_ || (connected_ && authenticated_);
}

void ProximityCheckerBLE::onCentralConnected() {
  connected_ = true;
  Serial.println("BLE: central connected — awaiting auth token.");
}

void ProximityCheckerBLE::onCentralDisconnected() {
  connected_ = false;
  authenticated_ = false;
  Serial.println("BLE: central disconnected — owner phone AWAY.");
}

void ProximityCheckerBLE::onAuthenticated() {
  authenticated_ = true;
  Serial.println("BLE: owner phone authenticated — NEARBY.");
}

void ProximityCheckerBLE::setPhoneNearby(bool nearby) {
  phoneOverride_ = nearby;
  Serial.println(nearby ? "SIM: phone override ON (forced nearby)"
                        : "SIM: phone override OFF (using real BLE link)");
}

void ProximityCheckerBLE::setKeyTagNearby(bool nearby) {
  keyTagNearby_ = nearby;
  Serial.println(nearby ? "SIM: Guardian Key Tag now NEARBY" : "SIM: Guardian Key Tag now AWAY");
}
