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
| Phase 3 | Quectel BG95-M3 (GPS + LTE in one module) | Week 4–7 | Location tracking + cloud alerts (built-in GNSS, so no separate GPS) |
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

### GPS + LTE Tracking — DECISION 2026-06-21: go straight to BG95-M3

Product decision: **private GPS + LTE tracking, NOT AirTag / Find My style.** A crowd-sourced
Bluetooth tracker would trigger "unknown tracker moving with you" anti-stalking alerts on the
thief's phone. The flow is: device gets GPS fix → sends location over LTE/SIM → owner sees it in
the app. The firmware keeps GPS and the cellular uplink behind driver interfaces (`Alerts.h`), so
the exact module can change without touching tracking logic.

**Decision:** skip the SIM7600/7670 prototype step and go directly with **BG95-M3** — same ~$30
price as the SIM7670G, but it's the low-power production-grade module, so we don't buy twice. One
module covers BOTH GPS and LTE (built-in GNSS); no separate GPS needed.

#### Buy now
| Part | Use | Notes | Price |
|---|---|---|---|
| **Quectel BG95-M3 board** | ✅ GPS + LTE (one module) | LTE-M/NB-IoT + built-in GNSS, low power, production-grade | ~$30–50 |
| **LTE-M-capable data SIM** | ✅ Required | Hologram or Twilio Super SIM — **must have LTE-M enabled** (BG95 does NOT do regular LTE). Production: Rogers/Bell IoT SIM (Canadian LTE-M cert) | ~$5–10 |

#### Only if needed (do NOT buy upfront)
| Part | When | Notes | Price |
|---|---|---|---|
| u-blox NEO-M9N / MAX-M10S | Only if BG95's built-in GNSS is too weak | Dedicated GNSS for faster fix / better sensitivity under trees/buildings; 3.3V | ~$20–25 |
| ESP32 + SIM7670G board | Only if BG95/LTE-M bring-up stalls | Fallback prototype path: runs on normal LTE (easier to get connected), Cat-1 | ~$30–40 |

#### Do NOT buy
| Part | Why |
|---|---|
| ~~NEO-6M~~ | EOL (all u-blox 6 modules) |
| ~~SIM7600G-H~~ | Cat-4, power hungry (~2A bursts), oversized for a tracker |

Caveats for going straight to BG95-M3:
- **LTE-M SIM is mandatory** — BG95 is LTE-M/NB-IoT only; a plain data SIM may not connect.
  Hologram and Twilio Super SIM both support LTE-M (enable it on the plan).
- **Slightly more dev effort** — LTE-M registration / AT-command bring-up is fiddlier than the
  hobby-friendly SIM7670G all-in-one. The SIM7670G fallback above exists if BG95 fights us.
- **LTE power:** cellular TX bursts will brown out / reset the ESP. Add a bulk capacitor
  (~1000µF+) at the module's supply, and feed from a solid 5V source — not laptop USB.

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

BLE is built into ESP32-S3 and sufficient for MVP. The main unit runs **dual-role BLE**: it is a
**peripheral** for the owner's phone (phone scans/connects — iOS background scanning is reliable,
advertising is not) and a **central/scanner** for the Guardian Key Tag (the ESP32-C3 tag
advertises; the main unit scans for it). ESP32-S3 supports both roles at once — watch memory.

| Part | Use | Notes | Price |
|---|---|---|---|
| ESP32-S3 BLE (built-in) | ✅ MVP proximity | Phone (peripheral) + key tag scan (central), ~1–5m, sufficient for MVP | Free |
| **ESP32-C3 mini / Seeed XIAO ESP32-C3** | ✅ Key Tag (V1) | BLE key tag: broadcasts presence, main unit scans; tiny piezo for "Find My Key" beep (BLE range only). No GPS in tag V1 | ~$5 (have x3) |
| Qorvo DWM3000EVB | Production relay attack | UWB ~10cm accuracy, required for high-confidence relay detection | ~$30 |

Key Tag V1 deliberately has **no GPS** — its job is "is a trusted key near the car," not global
tracking. GPS in the tag would add cost, size, battery drain, and need its own LTE uplink.

---

### Intrusion Sensing (door / hood / vibration) — DECISION 2026-06-21: layered sensors

Layered approach so a weak signal escalates only when confirmed. The MPU sees whole-car motion;
the shock sensor flags a break-in *attempt*; the reed switches *confirm* an actual door/hood open.

| Part | Use | Notes | Price |
|---|---|---|---|
| **MPU-6050 (rear/main unit)** | ✅ Whole-car motion | Tilt / tow / jack / strong shock. Mounted firmly inside the main enclosure on the car body — never loose. Already have x5 (dev) | ~$5 |
| **Automotive shock / vibration sensor** | ✅ Door/front-area attempt | Break-in vibration near driver door. Simple trigger output — better than a 2nd MPU (no long I2C run in-cabin). ⚠️ Use a 3.3V/5V module, NOT a 12V car-alarm sensor straight into a GPIO (needs optocoupler/divider if 12V) | ~$3–6 |
| **Magnetic reed switch x2** | ✅ Door + hood open confirm | One on door frame, one on engine-bay frame; magnet on the moving door/hood. Closed = magnet near = shut; open = magnet away. Trivial wiring: GPIO + internal pull-up | ~$1 each |
| **Small neodymium magnets x2** | ✅ Reed pairs | Pair with each reed switch | ~$1 |

Why shock sensor instead of a second MPU at the door: I2C is not meant for long in-cabin cable
runs (unreliable). A shock sensor is a single digital trigger on a GPIO — simpler and tunable.

Escalation logic (with phone/key tag absent → Suspicious Watch Mode):
```
Shock sensor       -> possible break-in attempt -> short siren chirp + push alert + GPS/LTE ready
Door reed OPEN     -> confirmed unauthorized entry -> full siren + high-rate GPS/LTE tracking
Hood reed OPEN     -> confirmed hood tamper -> full siren + high-rate GPS/LTE tracking
Rear MPU tilt/tow  -> possible tow/jack -> siren + push (severity-dependent)
```

⚠️ Before wiring: confirm free GPIO count once GPS/LTE UART + MPU I2C + siren + shock + 2 reed
inputs are all assigned, and protect any car-side inputs (debounce, pull-ups, transient).

---

## Production BOM Summary (Lock Before Manufacturing)

| Subsystem | Production Component | Status |
|---|---|---|
| MCU | ESP32-S3 (V1) → nRF52840 (V2) | Confirmed |
| IMU (whole-car motion) | ICM-42688-P (rear/main unit) | Not yet ordered |
| GPS/LTE | BG95-M3 (one module, built-in GNSS; NEO-M9N only if GNSS too weak) | Not yet ordered |
| Door/hood open | 2x magnetic reed switch + magnets | Not yet ordered |
| Break-in vibration | Automotive shock sensor (3.3V/5V module) | Not yet ordered |
| Key Tag | ESP32-C3 BLE (V1, no GPS) | Have x3 |
| CAN | ESP32 TWAI + SN65HVD230 | Not yet ordered |
| Power | BQ24074/BQ24075 power-path charger | Not yet ordered |
| Battery | 5000–7000mAh Li-ion | Size TBD after current measurement |
| Evidence storage | SPI NOR Flash + microSD | Not yet ordered |
| Power regulation | Automotive-rated 12V→5V + fuse + TVS | Have buck/TVS/fuse |
| Siren driver | MOSFET relay module | Not yet ordered |
| Proximity | Dual-role BLE: phone (peripheral) + key tag (central); UWB (DWM3000) for V2 | V2 only |
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
