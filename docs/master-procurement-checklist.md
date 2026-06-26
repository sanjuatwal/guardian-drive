# Guardian Drive - Master Procurement Checklist

Date: 2026-06-04 (updated 2026-06-21)
Purpose: Buy the full planned hardware now so execution is not blocked later.

## Already Ordered (12 items)

These are already ordered or received and should not be reordered.

- [x] Freenove ESP32-S3 dev board x1
- [x] MPU-6050 GY-521 x5 (DEV only)
- [x] Breadboard + jumper kit x1
- [x] Logic level shifter x5
- [x] INMP441 microphone x1 (passive evidence only, not MVP trigger)
- [x] ESP32-C3 mini dev board x3 (Order #701-5951519-0273823, delivered 2026-06-15) — covers P2 need for 2 (1 dev + 1 spare); 1 extra spare on hand
- [x] Small LiPo battery 300mAh x2, PH1.25 connector (Order #701-5413533-8776214, delivered 2026-06-14) — Guardian Key Tag dev-stage battery, matches P2 spec
- [x] TVS diode 1.5KE18A 18V x20 (Order #701-5413533-8776214, delivered 2026-06-14) — covers P2 need for 2, large spare stock
- [x] Inline fuse holder + blade fuses, 5-pack/60 fuses (Order #701-5413533-8776214, delivered 2026-06-14) — covers P2 need for 1 set
- [x] Automotive 12V->5V buck converter, DROK waterproof 8-35V to 5V 3A (Order #701-5413533-8776214, delivered 2026-06-14) — covers P2 need for 1
- [x] Active buzzer 5V x10 (Cylewet, Order #701-5413533-8776214, delivered 2026-06-14) — covers P1 bench siren-substitute need for 1, large spare stock
- [x] 3.7V 2000mAh LiPo battery, 103450, JST PH2.0 (Order #701-5413533-8776214, delivered 2026-06-14) — NOT on original BOM; appears to be a general dev/bench battery for current-draw measurement, not the P1 production target (5000-7000mAh Li-ion) or the Key Tag battery (150-300mAh, already covered above). Keep for bench current-draw testing only.

## Buy Now (Full Remaining Project List)

This is the corrected production-aware list (no deprecated parts).
Priority reflects the Tier 1/2/3 stop-and-recovery design (see below) and current firmware state
(WiFi comms + IMU working, relay/power/tracking next).

| Priority | Item | Qty | Target Use | Approx Cost (CAD) | Notes |
|---|---|---:|---|---:|---|
| P1 | 4-channel relay module (or 2x dual-relay) | 1 | Siren + hazard lights + horn chirp + starter-kill (Tier 1, bench) | 12-16 | Upgraded from 2ch — Layer 1 theft-mode actions (Section 3 of feature-document.md) need 4 actuation channels; never drive siren/relay direct from GPIO |
| P1 | BQ24074/BQ24075 power-path charger module | 2 | Dev + spare | 16 | Required for proper load sharing |
| P1 | Li-ion battery 5000-7000mAh | 1 | Theft mode runtime target | 20 | Final size confirmed by current testing |
| P2 | Quectel BG95-M3 board | 1 | Tier 2 GPS + LTE on one module (Week 5) | 30-50 | DECISION 2026-06-21: go STRAIGHT to BG95-M3 (skip the SIM7670G prototype step) — same ~$30 price but it's the low-power production module, so we don't buy twice. Built-in GNSS = one module for GPS+LTE. Needs a bulk cap (~1000uF) for LTE TX bursts |
| P2 | LTE-M-capable data SIM (Hologram / Twilio Super SIM) | 1 | Cellular connectivity for BG95-M3 | 5-10 | ⚠️ MUST support LTE-M — BG95 does NOT do regular LTE; a plain SIM may not connect. Hologram/Twilio both support LTE-M (enable on plan). Production: Rogers/Bell IoT SIM (Canadian LTE-M cert) |
| P2 | Magnetic reed switch + magnet | 2 | Door open + hood open confirmation (Section 1 correlation) | 2-4 | One on door frame, one on engine-bay frame; magnet on moving panel. GPIO + internal pull-up |
| P2 | Automotive shock/vibration sensor (3.3V/5V module) | 1-2 | Door/front break-in attempt detection | 4-8 | Use a 3.3V/5V module — NOT a 12V car-alarm sensor straight to GPIO. Replaces a 2nd door-MPU (avoids long I2C run) |
| P2 | Piezo buzzer (tiny) | 2 | Guardian Key Tag "Find My Key" beep (Section 12) | 2 | |
| P2 | 12V automotive weatherproof siren | 1 | Theft response (final) | 15 | Use weatherproof model |
| Only-if-needed | u-blox NEO-M9N / MAX-M10S GPS | 1 | Dedicated GNSS only if BG95's built-in GNSS is too weak | 20-25 | Don't buy upfront — try BG95's onboard GNSS first. Do not buy NEO-6M (EOL) |
| Only-if-needed | ESP32 + SIM7670G board | 1 | Fallback only if BG95/LTE-M bring-up stalls | 30-40 | Runs on normal LTE (easier to connect), Cat-1. Don't buy unless BG95 fights us |
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
- Relay interrupts only the **start authorization signal**, normally-closed: de-energized = circuit intact = car can start. NOT the main battery, ECU power, fuel pump, ABS, steering, or any safety circuit.
- Only engaged while armed AND vehicle confirmed off/stationary (speed ~0).
- Fail-safe: device power loss or crash -> relay de-energizes -> start circuit restored. Owner is never stranded by a firmware bug.
- Valet/bypass switch always available.

**Install method (DECISION 2026-06-21): vehicle-specific plug-in harness, NOT factory-wire cutting.**
On supported vehicles the relay lives in a plug-in harness that sits *between* a factory
connector and its module (`factory connector → Guardian harness → factory module`) — the
installer unplugs the factory connector and plugs the Guardian harness in between. Rationale:
- **No factory wire cutting** — premium/trustworthy positioning ("no factory wire cutting on supported vehicles"); avoids warranty/warning-light/resale concerns.
- **Reversible** — a mechanic can unplug the harness and reconnect the original factory connector.
- **Emergency bypass connector** in the harness restores the original connection if the device ever fails.
- This is a **Guardian Pro** (professional-install) feature — see "Product Editions" in feature-document.md. Bench prototyping still uses a bare relay module to prove the logic; the harness is the install form factor, not a logic change.
- Goal stays "prevent restart after confirmed theft while parked," never "shut off a moving vehicle."

**Tier 2 — Track + escalate (P2, Week 5)**
- GPS + LTE (BG95-M3, built-in GNSS) / WiFi reports live location on geofence breach or theft-mode entry.
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
- SIM7600/7670 in a PRODUCTION build (too power hungry) — prototype only; production is BG95-M3
- 12V car-alarm shock sensors wired straight to an ESP32 GPIO (use a 3.3V/5V module, or opto/divider)
- MCP2515 5V CAN modules (wrong voltage path for ESP32-S3 TWAI setup)
- TP4056 for car-connected build (no power-path/load sharing)
- Any relay/module marketed for "remote engine cutoff while driving" — out of scope, see Stop & Recovery Design Scope above

## Estimated Remaining Budget

- Lean buy (single quantity each): about 195-220 CAD
- With spares/safety extras: about 235-285 CAD
- Remaining after 2026-06-13 orders (ESP32-C3 x3, Key Tag LiPo, TVS, fuse holder, buck converter, buzzer all received): roughly 110-130 CAD for 4-channel relay, BQ24074 x2, production battery, BG95-M3 board + LTE-M SIM, 2x reed switch + magnets, shock sensor, tiny piezo buzzer x2, and the real siren

## Ordering Sequence If You Place Across Multiple Carts

1. P1 now: 4-channel relay module, BQ24074 x2, production battery (5000-7000mAh Li-ion) — unblocks Tier 1 (starter-kill + siren/hazard/horn) + power bench work; buzzer already on hand
2. P2 remaining (before any car-connected test): BG95-M3 board + LTE-M SIM (GPS+LTE in one), 2x reed switch + magnets (door/hood), shock sensor, tiny piezo buzzer x2 (Key Tag beep), 12V automotive weatherproof siren — ESP32-C3, Key Tag LiPo, buck converter, TVS, fuse holder already received
3. Only-if-needed: NEO-M9N (if BG95 GNSS too weak), SIM7670G board (if BG95/LTE-M stalls); P3 later: SN65HVD230 + OBD cable, W25Q64, ATECC608B, ICM-42688-P, MicroSD, enclosure, CR2032 holder + cells (Key Tag production testing)

## Verification Checklist Before Checkout

- [ ] Every item is 3.3V-compatible where required (shock sensor especially — no 12V to GPIO)
- [ ] GPS+LTE module is BG95-M3 (built-in GNSS; not NEO-6M, not SIM7600)
- [ ] Data SIM has LTE-M ENABLED (BG95 won't connect on plain LTE) — Hologram/Twilio
- [ ] CAN path is SN65HVD230 + ESP32 TWAI
- [ ] Charger is BQ24074/BQ24075 (not TP4056)
- [ ] Automotive power protection parts (buck + TVS + fuse) included
