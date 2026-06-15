# Guardian Drive - Master Procurement Checklist

Date: 2026-06-04 (updated 2026-06-11)
Purpose: Buy the full planned hardware now so execution is not blocked later.

## Already Ordered (5 items)

These are already ordered or received and should not be reordered.

- [x] Freenove ESP32-S3 dev board x1
- [x] MPU-6050 GY-521 x5 (DEV only)
- [x] Breadboard + jumper kit x1
- [x] Logic level shifter x5
- [x] INMP441 microphone x1 (passive evidence only, not MVP trigger)

## Buy Now (Full Remaining Project List)

This is the corrected production-aware list (no deprecated parts).
Priority reflects the Tier 1/2/3 stop-and-recovery design (see below) and current firmware state
(WiFi comms + IMU working, relay/power/tracking next).

| Priority | Item | Qty | Target Use | Approx Cost (CAD) | Notes |
|---|---|---:|---|---:|---|
| P1 | 4-channel relay module (or 2x dual-relay) | 1 | Siren + hazard lights + horn chirp + starter-kill (Tier 1, bench) | 12-16 | Upgraded from 2ch — Layer 1 theft-mode actions (Section 3 of feature-document.md) need 4 actuation channels; never drive siren/relay direct from GPIO |
| P1 | Active buzzer (5V) | 1 | Bench substitute for siren | ~2 | Write/test siren-trigger logic before the real siren arrives |
| P1 | BQ24074/BQ24075 power-path charger module | 2 | Dev + spare | 16 | Required for proper load sharing |
| P1 | Li-ion battery 5000-7000mAh | 1 | Theft mode runtime target | 20 | Final size confirmed by current testing |
| P2 | u-blox NEO-M9N GPS | 1 | Tier 2 tracking (Week 5) | 25 | Do not buy NEO-6M (EOL) |
| P2 | ESP32-C3 mini dev board (BLE) | 2 | Guardian Key Tag prototype (Section 12 — was missing from BOM entirely) | 10 | 1 for dev + 1 spare; matches existing ESP32 toolchain |
| P2 | Small LiPo battery (150-300mAh) | 2 | Guardian Key Tag dev-stage battery | 10 | Dev-stage only |
| P2 | Piezo buzzer (tiny) | 2 | Guardian Key Tag "Find My Key" beep (Section 12) | 2 | |
| P2 | Automotive 12V->5V buck converter | 1 | Vehicle power | 8 | Automotive grade — needed once vehicle-connected |
| P2 | TVS diode (automotive rated) | 2 | Surge protection | 4 | Load-dump/transient protection |
| P2 | Inline fuse holder + blade fuses | 1 set | Vehicle safety | 4 | Mandatory for car-connected testing |
| P2 | 12V automotive weatherproof siren | 1 | Theft response (final) | 15 | Use weatherproof model |
| P3 | Quectel BG95-M3 LTE dev board | 1 | Tier 2 cellular path | 30 | Deprioritized — WiFi (`Alerts_WiFi`) covers Tier 2 dev/testing now. `Alerts.h` interface makes this a drop-in later. Prefer BG95-M3 over SIM7600G-H when bought |
| P3 | SN65HVD230 CAN transceiver | 2 | Dev + spare (read-only CAN) | 8 | ESP32 TWAI compatible (3.3V) |
| P3 | OBD-II breakout cable | 1 | Dev + Production | 8 | For vehicle CAN access (read-only) |
| P3 | W25Q64 SPI NOR flash module | 2 | Evidence logs + spare | 6 | For tamper-resilient event storage |
| P3 | ATECC608B secure element module | 1-2 | Crypto signing | 4-8 | Evidence signing chain |
| P3 | ICM-42688-P IMU breakout | 1-2 | Production IMU | 8-16 | Production replacement for MPU-6050 |
| P3 | MicroSD card + module | 1 | Raw/debug logs | 8 | Debug storage only |
| P3 | IP65 weatherproof enclosure + mounts | 1 | Physical install | 15 | For underbody/bumper protection, final install |
| P3 | CR2032 holder + cells | 2-3 | Guardian Key Tag production-style low-power testing | 3 | For later low-power validation, after dev-stage LiPo testing |

## Stop & Recovery Design Scope (Tier 1 / 2 / 3)

This replaces the original "start-inhibit" framing with a safety-tiered design.

**Tier 1 — Starter-kill, parked-only (P1, this week)**
- Relay sits in the starter/ignition circuit, normally-closed: de-energized = circuit intact = car can start.
- Only engaged while armed AND vehicle confirmed off/stationary (speed ~0).
- Fail-safe: device power loss or crash -> relay de-energizes -> starter circuit restored. Owner is never stranded by a firmware bug.
- Valet/bypass switch always available.

**Tier 2 — Track + escalate (P2, Week 5)**
- GPS (NEO-M9N) + WiFi/LTE reports live location on geofence breach or theft-mode entry.
- Adaptive ping rate per project-plan.md Week 5 (parked 2h / suspicious 60s / theft 10s).
- This is the primary "stop the theft" mechanism — live location handed to owner/police, same model as LoJack/insurance trackers.

**Tier 3 — Speed-gated fuel cutoff (optional, post-MVP, careful)**
- Only fires when GPS speed ~= 0 (vehicle already stopped) — matches project-plan.md Week 4 "Next-start inhibit ... fire when GPS speed < 8 km/h".
- Prevents restart after the thief's next stop; never interrupts a moving vehicle.
- Test extensively on owner's own vehicle before considering default-on.

**Explicitly OUT OF SCOPE (removed):**
- Remote engine/fuel stop while the vehicle is in motion — not planned for MVP or V1.5. Safety/liability risk (could cause an accident).
- CAN-bus / ECU remote immobilization commands — CAN/OBD stays read-only (diagnostics/tamper detection only), no command injection to the ECU.

## Optional But Smart To Order Now

- [ ] Extra jumper wires and Dupont kits (consumable)
- [ ] Crimp tool + automotive connector set
- [ ] Heat-shrink assortment + loom tape
- [ ] 3.3V/5V bench power module for breadboard testing

## Parts To Avoid (Do Not Buy)

- NEO-6M GPS (EOL)
- SIM7600G-H for production path (too power hungry)
- MCP2515 5V CAN modules (wrong voltage path for ESP32-S3 TWAI setup)
- TP4056 for car-connected build (no power-path/load sharing)
- Any relay/module marketed for "remote engine cutoff while driving" — out of scope, see Stop & Recovery Design Scope above

## Estimated Remaining Budget

- Lean buy (single quantity each): about 195-220 CAD
- With spares/safety extras: about 235-285 CAD

## Ordering Sequence If You Place Across Multiple Carts

1. P1 now: 4-channel relay module, buzzer, BQ24074, battery — unblocks Tier 1 (starter-kill + siren/hazard/horn) + power bench work this week
2. P2 next (before any car-connected test): NEO-M9N, ESP32-C3 x2 + LiPo + piezo buzzer (Guardian Key Tag prototype), buck converter, TVS, fuse holder, siren
3. P3 later: BG95-M3, SN65HVD230 + OBD cable, W25Q64, ATECC608B, ICM-42688-P, MicroSD, enclosure, CR2032 holder + cells (Key Tag production testing)

## Verification Checklist Before Checkout

- [ ] Every item is 3.3V-compatible where required
- [ ] GPS is NEO-M9N (not NEO-6M)
- [ ] LTE is BG95-M3 class module (not SIM7600G-H)
- [ ] CAN path is SN65HVD230 + ESP32 TWAI
- [ ] Charger is BQ24074/BQ24075 (not TP4056)
- [ ] Automotive power protection parts (buck + TVS + fuse) included
