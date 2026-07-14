#include "GNSS_SIM7670G.h"
#include "config.h"

// Serial1: ESP32 RX=GPIO17 (← SIM TX), TX=GPIO18 (→ SIM RX)
#define SIM_SERIAL Serial1
#define SIM_BAUD   115200

bool GNSS_SIM7670G::begin() {
  SIM_SERIAL.begin(SIM_BAUD, SERIAL_8N1, SIM_UART_RX, SIM_UART_TX);

  Serial.println("[GPS] Powering on SIM7670G...");
  if (!powerOn()) {
    Serial.println("[GPS] Modem power-on failed");
    return false;
  }

  delay(1000);  // let modem fully settle after AT responds

  // Disable echo
  sendAT("ATE0", "OK", 2000);
  delay(200);

  // --- Modem identification ---
  auto query = [&](const char* cmd) {
    while (SIM_SERIAL.available()) SIM_SERIAL.read();
    SIM_SERIAL.println(cmd);
    String r = readResponse(3000);
    r.trim();
    Serial.print("[GPS] "); Serial.print(cmd);
    Serial.print(" => "); Serial.println(r);
  };
  query("ATI");
  query("AT+CGMM");
  query("AT+CGMR");

  // SIM7670G-MNGV uses AT+CGNSSPWR (double-S prefix: CGNSS not CGNS)
  if (!sendAT("AT+CGNSSPWR=1", "OK", 5000)) {
    Serial.println("[GPS] AT+CGNSSPWR=1 failed");
    return false;
  }

  Serial.println("[GPS] GNSS on — waiting for fix (may take 30-60s cold start)");
  return true;
}

bool GNSS_SIM7670G::read(GPSReading& out) {
  out.valid = false;

  // AT+CGNSSINFO: +CGNSSINFO: mode,GPSsats,GLONASSsats,BEIDOUsats,lat,N/S,lon,E/W,date,utc,alt,speed,course,...
  // No fix:       +CGNSSINFO: ,,,,,,,,,,,,
  SIM_SERIAL.println("AT+CGNSSINFO");
  String resp = readResponse(3000);

  int idx = resp.indexOf("+CGNSSINFO:");
  if (idx < 0) {
    Serial.println("[GPS] No +CGNSSINFO response");
    return false;
  }

  String data = resp.substring(idx + 11);
  data.trim();

  auto nextField = [&](int& pos) -> String {
    int comma = data.indexOf(',', pos);
    String f = (comma < 0) ? data.substring(pos) : data.substring(pos, comma);
    pos = (comma < 0) ? data.length() : comma + 1;
    return f;
  };

  // Print raw so we can verify field offsets
  Serial.print("[GPS] raw: "); Serial.println(data);

  // SIM7670G-MNGV CGNSSINFO field layout (confirmed from raw output):
  // [0] fix_mode  [1] GPS_sats  [2] GLONASS_sats  [3] BEIDOU_sats
  // [4] sats_in_use  [5] lat(decimal°)  [6] N/S  [7] lon(decimal°)
  // [8] E/W  [9] DDMMYY  [10] HHMMSS.sss  [11] alt_m  [12] speed_knots  [13] course ...
  int pos = 0;
  String fixMode = nextField(pos); // [0] fix mode: 0=no fix, 1=GPS, 2=DGPS, 3=PPS
  (void)nextField(pos);            // [1] GPS sats in view
  (void)nextField(pos);            // [2] GLONASS sats in view
  (void)nextField(pos);            // [3] BEIDOU sats in view
  (void)nextField(pos);            // [4] total sats in use
  String lat   = nextField(pos);   // [5] latitude  decimal degrees
  String ns    = nextField(pos);   // [6] N/S
  String lon   = nextField(pos);   // [7] longitude decimal degrees
  String ew    = nextField(pos);   // [8] E/W
  String date  = nextField(pos);   // [9] DDMMYY
  String utc   = nextField(pos);   // [10] HHMMSS.sss
  String alt   = nextField(pos);   // [11] altitude m
  String speed = nextField(pos);   // [12] speed knots

  if (fixMode.length() == 0 || fixMode == "0") {
    Serial.println("[GPS] No fix yet");
    return false;
  }

  // Lat/lon already in decimal degrees on this firmware (not NMEA ddmm format)
  out.valid     = true;
  out.latitude  = lat.toFloat()  * (ns == "S" ? -1.0f : 1.0f);
  out.longitude = lon.toFloat()  * (ew == "W" ? -1.0f : 1.0f);
  out.altitudeM = alt.toFloat();
  out.speedKmh  = speed.toFloat() * 1.852f;  // knots → km/h
  String utcFull = date + utc;
  strncpy(out.utcTime, utcFull.c_str(), sizeof(out.utcTime) - 1);
  out.utcTime[sizeof(out.utcTime) - 1] = '\0';

  return true;
}

bool GNSS_SIM7670G::isModemAlive() {
  return sendAT("AT", "OK", 2000);
}

bool GNSS_SIM7670G::powerOn() {
  pinMode(SIM_PWRKEY, OUTPUT);

  // Drive PWRKEY HIGH — on Waveshare/UeeKKoo board GPIO33 is a level enable:
  // HIGH = modem on, LOW = modem off (not a pulse like bare SIM7670G modules).
  digitalWrite(SIM_PWRKEY, HIGH);
  delay(500);

  // Give modem time to boot and become responsive
  Serial.print("[GPS] Waiting for modem");
  for (int i = 0; i < 10; i++) {
    delay(1000);
    Serial.print(".");
    if (sendAT("AT", "OK", 1000)) {
      Serial.println(" OK");
      return true;
    }
  }

  // If level-HIGH didn't work, try a pulse (bare module PWRKEY behaviour)
  Serial.println("\n[GPS] Level enable failed, trying PWRKEY pulse...");
  digitalWrite(SIM_PWRKEY, LOW);
  delay(1000);
  digitalWrite(SIM_PWRKEY, HIGH);
  delay(5000);

  for (int i = 0; i < 8; i++) {
    delay(1000);
    Serial.print(".");
    if (sendAT("AT", "OK", 1000)) {
      Serial.println(" OK");
      return true;
    }
  }

  Serial.println(" timed out");
  return false;
}

bool GNSS_SIM7670G::sendAT(const char* cmd, const char* expected, unsigned long timeoutMs) {
  while (SIM_SERIAL.available()) SIM_SERIAL.read();  // flush
  SIM_SERIAL.println(cmd);
  String resp = readResponse(timeoutMs);
  return resp.indexOf(expected) >= 0;
}

String GNSS_SIM7670G::readResponse(unsigned long timeoutMs) {
  String resp;
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    while (SIM_SERIAL.available()) {
      resp += (char)SIM_SERIAL.read();
    }
    // Stop early once we see a terminal line
    if (resp.indexOf("OK") >= 0 || resp.indexOf("ERROR") >= 0 ||
        resp.indexOf("+CGNSSINFO:") >= 0) {
      break;
    }
    delay(10);
  }
  return resp;
}
