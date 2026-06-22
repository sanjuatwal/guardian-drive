# Guardian Drive — Testing Stages

## Rule of Thumb

> If it does not work on the desk, it will not work in the car.
> Solve every problem at the cheapest stage possible.

Never connect to the car until Stages 1 and 2 are fully passing.

---

## Stage 1 — Bench Testing (Desk Only, USB Power)

**Goal:** Confirm each sensor works individually before connecting anything together.

**Setup:** Breadboard + ESP32-S3 + USB power + Arduino IDE Serial Monitor

### Checklist

#### IMU (MPU-6050)
- [ ] Wire MPU-6050 to ESP32 via I2C (SDA, SCL, 3.3V, GND)
- [ ] Upload basic MPU-6050 read sketch
- [ ] Open Serial Monitor at 115200 baud
- [ ] Hold the board flat — confirm baseline X/Y/Z accelerometer values near 0/0/1g
- [ ] Tilt the board 45 degrees — confirm values change clearly
- [ ] Shake the board — confirm spike in accelerometer values
- [ ] Set a threshold (e.g. >0.3g delta) and confirm it triggers a "MOTION DETECTED" print

#### Microphone (INMP441) — Passive Evidence Sensor Only

> Glass break detection is removed from MVP. The INMP441 mic is kept as a passive evidence recorder only.
> No bench test needed for audio detection. Wire and test only if glass break is added in V1.5+.

#### GPS + LTE (Quectel BG95-M3 — one module does both)

BG95-M3 has built-in GNSS, so GPS and the cellular uplink come from the same module — no
separate GPS part. Test GPS first (no SIM needed), then the LTE uplink.

GPS (GNSS):
- [ ] Wire BG95-M3 to ESP32 via UART (TX→RX, RX→TX, 3.3V, GND); add a bulk cap (~1000µF) on the module supply
- [ ] Enable GNSS via AT command (`AT+QGPS=1`)
- [ ] Take the breadboard near a window or go outside
- [ ] Confirm latitude/longitude (`AT+QGPSLOC?`) within ~30–60 s cold start
- [ ] Confirm time/date from GPS is correct

LTE uplink:
- [ ] Insert an **LTE-M-enabled** SIM (Hologram or Twilio Super SIM — BG95 does NOT do plain LTE)
- [ ] Use AT commands to confirm module responds: `AT` → `OK`
- [ ] Confirm cellular registration: `AT+CEREG?` → registered (LTE-M mode)
- [ ] Send a test HTTP POST to a webhook (use webhook.site for quick testing)
- [ ] Confirm the payload arrives in browser

> Note: BG95-M3 is LTE-M/NB-IoT only. Use LTE-M mode for Canadian carriers, and make sure the
> SIM has LTE-M enabled or it will not register.

#### Backup Battery (Li-ion + BQ24074 power-path charger)
- [ ] Connect Li-ion battery to BQ24074 charger module
- [ ] Power ESP32 from BQ24074 system output rail
- [ ] Confirm ESP32 boots and runs normally on battery
- [ ] Measure voltage with multimeter — confirm ~4.1V when full
- [ ] With charger connected: confirm device runs from charger AND charges battery simultaneously (power-path)
- [ ] Disconnect main power: confirm device instantly switches to battery with no brownout
- [ ] Time how long device stays on under load (target: 48+ hours at full charge)

---

## Stage 2 — Integration Testing (All Sensors Together, Desk)

**Goal:** Run all sensors simultaneously and confirm the risk scoring logic works.

### Checklist
- [ ] All sensors wired together on one breadboard
- [ ] Write combined firmware: each sensor feeds events into a shared event queue
- [ ] Simulate a low-risk event: tilt board gently alone → score should be low (< 30%)
- [ ] Simulate a medium-risk event: tilt + loud sound → score should rise (30–60%)
- [ ] Simulate a high-risk event: tilt + sound + no BLE phone nearby + 2 AM time check → score > 80%
- [ ] Confirm LTE alert fires only when score exceeds threshold
- [ ] Confirm alert arrives on phone within 10 seconds of simulated event
- [ ] Test backup battery takeover: unplug USB while running → device continues on LiPo
- [ ] Confirm "power cut detected" event logs correctly

---

## Stage 3 — Bench-to-Car Power Test (Parked Car, Engine Off)

**Goal:** Confirm the device runs from OBD port power. No sensors wired to anything critical.

### Checklist
- [ ] Build a simple 12V to 3.3V step-down regulator circuit OR use a pre-built buck converter module
- [ ] Connect OBD-II cable to car port
- [ ] Tap the 12V pin from OBD cable through your buck converter
- [ ] Power ESP32 from the regulated output
- [ ] Confirm ESP32 boots from car power with Serial Monitor via laptop
- [ ] Confirm voltage is stable at 3.3V under load
- [ ] Unplug OBD cable — confirm LiPo backup takes over immediately

---

## Stage 4 — Parked Field Test (Full Breadboard in Car, No Driving)

**Goal:** Test all sensors in the actual vehicle environment without moving.

### Checklist
- [ ] Mount breadboard securely (zip ties or velcro) near the OBD port or under dash
- [ ] Run laptop into car via USB for Serial Monitor monitoring
- [ ] Rock the car from outside — confirm tow/tilt detection triggers
- [ ] Tap the window from outside — confirm impact event logs (damage alert, not theft)
- [ ] Note: glass break detection is not in MVP. Mic not used here.
- [ ] Lock the car and walk 50m away with phone — confirm phone absence detected via BLE
- [ ] Start the car without phone nearby — confirm unauthorized start event logs
- [ ] Disconnect OBD cable — confirm power cut event + battery takeover
- [ ] Confirm all events are timestamped correctly
- [ ] Confirm LTE alert fires and arrives on phone within 10 seconds

---

## Stage 5 — Real Drive Test

**Goal:** Validate the system under real driving conditions.

### Checklist
- [ ] Confirm baseline IMU values stabilize while driving normally
- [ ] Confirm no false alerts during normal acceleration, braking, and turning
- [ ] Confirm GPS tracks the route accurately
- [ ] Confirm LTE maintains connection during drive
- [ ] Confirm adaptive ping rate changes: faster when moving fast, slower when parked
- [ ] Park in an unfamiliar location overnight — confirm no false alerts
- [ ] Simulate return home — confirm geofence lowers sensitivity correctly

---

## Notes

- Always have a laptop connected via USB during Stages 1–3 so you can read Serial Monitor output in real time.
- [ ] Log everything to SPI NOR Flash (W25Q64) from Stage 2 onward for tamper-resistant evidence records.
- [ ] MicroSD is acceptable for debug/raw logs only.
- Do not skip stages. Each stage catches problems cheaply before they become expensive car problems.
