# Guardian Drive — Bill of Materials (BOM)

> Two separate tracks: DEV (learn/validate) and PRODUCTION (ship to customers).
> These are NOT the same list. Do not mix them.

---

## The Rule

```
DEV hardware  = cheap, easy, throwaway. Proves the algorithm works.
PROD hardware = correct, durable, production-certified. Ships to customers.
```

Since hardware cannot be changed after shipping, production choices must be
finalized before manufacturing. Use dev phase to validate detection logic,
then lock the production BOM before ordering PCBs.

---

## Already Bought (DEV only)

| Component | Status | Notes |
|---|---|---|
| Freenove ESP32-S3 | ✅ Keep for dev + MVP | Good prototype brain, acceptable for V1 production too |
| MPU-6050 x5 | ✅ Keep for dev only | EOL sensor, good for learning tilt/tow logic |
| INMP441 microphone | ✅ Keep as nice-to-have | Audio evidence sensor, not core MVP trigger |
| BOJACK breadboard kit | ✅ Keep for bench | Dev only, never ships in product |
| Logic level shifters x5 | ⚠️ Use carefully | Fine for I2C dev, not reliable for fast SPI/CAN |

---

## Dev Phase Order (Buy When You Reach That Sprint)

Order in this sequence. Each unlocks the next test stage.

| Phase | Component | Sprint | Why |
|---|---|---|---|
| Phase 1 | Already have everything | Week 1–2 | MPU-6050 tilt/tow bench testing |
| Phase 2 | 12V siren + MOSFET relay module | Week 3 | Siren trigger without car |
| Phase 3 | u-blox NEO-M9N GPS (not NEO-6M) | Week 4–5 | Location tracking |
| Phase 4 | Quectel BG95-M3 LTE dev board | Week 6–7 | Cloud alerts |
| Phase 5 | Power-path LiPo charger + battery | Week 8 | Backup battery testing |
| Phase 6 | OBD-II cable + SN65HVD230 CAN transceiver | Week 9–10 | Vehicle CAN reading |

---

## Dev Components Detail

### Processor (Dev + MVP Production)

| Part | Use | Notes | Price |
|---|---|---|---|
| **Freenove ESP32-S3** | ✅ Dev + acceptable MVP | 8MB flash, WiFi+BLE, Arduino support | ~$21 CAD |
| nRF52840 (future) | Production v2 | Better BLE/UWB power profile | ~$50 |

ESP32-S3 is acceptable for V1 production. Switch to nRF52 only if power
consumption or BLE precision becomes a limiting factor post-launch.

---

### IMU (Dev only → upgrade for production)

| Part | Use | Notes | Price |
|---|---|---|---|
| **MPU-6050** | ✅ Dev only | Already bought, EOL sensor, sufficient for algorithm dev | ~$5 |
| **ICM-42688-P** | ✅ Production | High precision, low noise, low power, 3.3V native | ~$8 |
| BMI270 | Alternative production | Good automotive-grade option | ~$6 |
| LSM6DSOX | Alternative production | ST sensor, widely used in automotive | ~$7 |

Do not ship MPU-6050 to customers. Use it only to validate detection algorithms,
then port the driver to ICM-42688-P before manufacturing.

---

### GPS (Do NOT buy NEO-6M — it is EOL)

NEO-6M is end-of-life. u-blox issued EOL notices for all u-blox 6 modules.
Do not order it even for dev — order the correct module from the start.

| Part | Use | Notes | Price |
|---|---|---|---|
| **u-blox NEO-M9N** | ✅ Dev + Production | Fast cold start, multi-GNSS, 3.3V, current production part | ~$25 |
| u-blox MAX-M10S | Alternative production | Smallest, lowest power, ultra-compact | ~$20 |

Buy NEO-M9N for Phase 3. It works for both dev testing and production.
No reason to buy a cheaper GPS and then switch — the price difference is small.

---

### LTE / Cellular (SIM7600G-H for learning only)

| Part | Use | Notes | Price |
|---|---|---|---|
| **SIM7600G-H dev board** | Dev/learning only | Cat-4 LTE, power hungry (~2A peak), oversized for IoT | ~$35 |
| **Quectel BG95-M3** | ✅ Production | LTE-M/NB-IoT, GNSS built-in, low power, IoT-optimized | ~$30 |
| SIMCom SIM7080G | Alternative production | LTE-M/NB-IoT, low power, good Canadian carrier support | ~$25 |

SIM7600G-H is acceptable for Phase 4 learning. Switch to BG95-M3 before
real car testing. BG95 also has built-in GNSS so you may not need separate
GPS module — evaluate this when you reach Phase 4.

SIM card: Hologram or Twilio Super SIM for dev. Evaluate Rogers/Bell IoT
SIM for production (Canadian carrier certification matters for LTE-M).

---

### CAN Bus / OBD Interface (Do NOT use MCP2515 5V board with ESP32)

Cheap MCP2515 boards use TJA1050 transceiver at 5V logic. ESP32-S3 is 3.3V.
This creates voltage compatibility issues. ESP32-S3 has a built-in TWAI/CAN
controller — use it directly with a 3.3V-compatible transceiver only.

| Part | Use | Notes | Price |
|---|---|---|---|
| **OBD-II breakout cable** | ✅ Dev + Production | Standard connector, same in all cars | ~$8 |
| **SN65HVD230 CAN transceiver** | ✅ Dev + Production | 3.3V native, works directly with ESP32 TWAI | ~$4 |
| TJA1051T/3 | Alternative | 3.3V compatible, automotive-grade | ~$5 |
| ~~MCP2515 5V board~~ | ❌ Do not use | 5V logic incompatible with ESP32-S3, unnecessary complexity | — |

Correct wiring:
```
ESP32-S3 TWAI TX/RX pins → SN65HVD230 → OBD CAN-H/CAN-L
```
No SPI needed. No level shifter needed. Simpler and correct.

---

### Power Management (TP4056 is NOT sufficient — do not use for product)

TP4056 boards do not provide power-path/load-sharing. The device needs to
run from car power, charge the battery simultaneously, and switch instantly
to battery on power cut — TP4056 cannot do this safely.

| Part | Use | Notes | Price |
|---|---|---|---|
| **BQ24074 / BQ24075 module** | ✅ Dev + Production | Power-path charging, load sharing, 3.3V/5V output | ~$8 |
| MCP73871-based board | Alternative | Power-path charger, widely available | ~$6 |
| IP5306 power bank module | Budget alternative | Simpler but less control, acceptable for bench testing | ~$4 |
| ~~TP4056~~ | ❌ Do not use for product | No load sharing, no power-path, insufficient for car device | — |

For bench testing only, TP4056 is acceptable to verify battery drain numbers.
Do not use it in any car testing or production build.

---

### Battery

| Part | Use | Notes | Price |
|---|---|---|---|
| **LiPo 2000–3000mAh** | Dev bench only | Already bought, good for measuring baseline drain | ~$10 |
| **Li-ion 5000–10000mAh** | Production target | Needed to hit 48–72h in theft mode with LTE active | ~$20 |

Measure actual current draw in Phase 5 before deciding final battery size.
Expected: LTE-M active ~50–80mA avg, GPS ~20mA, ESP32 ~30mA = ~100–130mA total.
At 100mA average: 3000mAh = 30 hours. Need 5000–7000mAh for 48–72h target.

---

### Evidence Storage (microSD alone is not tamper-resistant)

| Part | Use | Notes | Price |
|---|---|---|---|
| **Micro SD card module** | Dev + debug logs | Good for large raw sensor logs | ~$3 |
| **SPI NOR Flash (W25Q64 or similar)** | ✅ Evidence logs | Fast, no mechanical parts, survives vibration/power loss | ~$3 |
| FRAM (MB85RS256B or similar) | Critical events only | Non-volatile, instant write, no corruption on power cut | ~$5 |

Split:
```
Critical evidence logs (theft events, hashes) → SPI NOR Flash or FRAM
Debug / raw sensor logs                        → microSD
```

---

### Power Regulation (automotive-grade required for car testing)

| Part | Use | Notes | Price |
|---|---|---|---|
| **Cheap 12V→5V buck** | Bench only | Fine for desk testing only | ~$3 |
| **Automotive-rated 12V→5V buck + fuse + TVS** | ✅ Car testing + Production | Handles cranking drops, voltage spikes, reverse polarity | ~$10–15 |

Car electrical systems are noisy. Cranking voltage can drop to 9V briefly.
Load dump spikes can reach 40V+. Cheap buck converters can fail or damage ESP32.
Add TVS diode and inline fuse for any car-connected testing.

---

### Siren

| Part | Use | Notes | Price |
|---|---|---|---|
| **12V piezo buzzer 120dB** | Dev bench only | Good for testing siren trigger logic | ~$5 |
| **12V automotive siren** | ✅ Car testing + Production | Louder, weatherproof, designed for vehicles | ~$15 |
| MOSFET relay module (logic-level) | ✅ Required | ESP32 GPIO → MOSFET → siren. Never wire siren directly to GPIO | ~$4 |

ESP32 GPIO outputs 3.3V max 40mA. Siren draws 12V/1–2A.
Always use a MOSFET or relay driver between ESP32 and siren.

---

### Proximity Detection (Owner Phone + Key Tag)

BLE is built into ESP32-S3 and sufficient for MVP (phone proximity detection).
UWB is required only for production-grade relay attack detection accuracy.

| Part | Use | Notes | Price |
|---|---|---|---|
| ESP32-S3 BLE (built-in) | ✅ MVP proximity | Phone detection, ~1–5m accuracy, sufficient for MVP | Free |
| Qorvo DWM3000EVB | Production relay attack | UWB ~10cm accuracy, required for high-confidence relay detection | ~$30 |
| Guardian Key Tag | Custom PCB (future) | Bluetooth/UWB tag on car key, does not exist yet | TBD |

---

## Production BOM Summary (Lock Before Manufacturing)

| Subsystem | Production Component | Status |
|---|---|---|
| MCU | ESP32-S3 (V1) → nRF52840 (V2) | Confirmed |
| IMU | ICM-42688-P | Not yet ordered |
| GPS | u-blox NEO-M9N or MAX-M10S | Not yet ordered |
| LTE | Quectel BG95-M3 | Not yet ordered |
| CAN | ESP32 TWAI + SN65HVD230 | Not yet ordered |
| Power | BQ24074/BQ24075 power-path charger | Not yet ordered |
| Battery | 5000–7000mAh Li-ion | Size TBD after current measurement |
| Evidence storage | SPI NOR Flash + microSD | Not yet ordered |
| Power regulation | Automotive-rated 12V→5V + fuse + TVS | Not yet ordered |
| Siren driver | MOSFET relay module | Not yet ordered |
| Proximity | BLE (built-in) for MVP, UWB (DWM3000) for V2 | V2 only |
| Enclosure | IP65 weatherproof, salt/vibration rated | Design TBD |

---

## Cost Summary

| Scope | Est. Cost |
|---|---|
| Dev bench (already bought) | ~$81 CAD |
| Remaining dev components (Phase 2–6) | ~$80–100 CAD |
| Full dev setup total | ~$160–180 CAD |
| Production unit BOM (est. per device) | ~$80–120 CAD |
| Production unit with enclosure + PCB | ~$150–200 CAD |

---

## Notes

- Never solder during bench testing. Breadboard + jumpers only until Phase 5.
- Measure actual current consumption before finalizing battery size.
- OBD port provides 12V. Always use step-down regulator + fuse before connecting to ESP32.
- For any car testing: inline fuse + TVS on 12V line is mandatory.
- Production PCB design starts after MVP algorithm validation (post Week 14).
- Do not order production components until detection algorithms are validated on dev hardware.
