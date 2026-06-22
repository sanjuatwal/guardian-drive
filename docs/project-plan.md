# Guardian Drive — Project Execution Plan

> Target: **MVP complete by August 8, 2026**
> Timeline: 9 weeks + 2 days from June 4, 2026

---

## Overview

**Team**: 2 engineers — E1 (firmware focus) | E2 (backend + app focus)
**Both**: Integration, testing, car testing, and all design decisions
**Execution model**: Weekly milestones, not 2-week sprints — too slow for a 9-week deadline
**Hard deadline**: August 8, 2026 — feature freeze, demo-ready MVP

**MVP scope (from feature-document.md):**
- Unauthorized unlock / start detection
- Phone + Guardian Key Tag proximity authorization
- Tow / tilt detection with parked baseline
- Battery disconnect alert + backup battery switchover
- Theft mode with live GPS tracking (adaptive ping rate)
- External siren (relay-driven, remote trigger)
- Critical emergency alert in app (full-screen, SMS/call backup)
- Risk score explanation
- Timeline + one-tap police report PDF
- Installer validation checklist (8-point)
- Crash vs. theft classification
- Fallback authorization (backup PIN, grace mode)
- Privacy modes (Balanced default)

---
## Week-by-Week Plan

## Engineering Principles (Non-Negotiable)

These apply to every line of code written — firmware, backend, and app.
### Week 1 — June 4–8: Foundation (do this NOW, hardware in transit)
- **Logic is always separate from hardware.** Business logic (risk scoring, theft detection, event logging) never talks to a sensor, chip, or protocol directly. It talks to an interface. The interface hides the hardware.
- **One driver file per component.** MPU-6050 has one file. BG95-M3 (GPS+LTE) has one file. The shock sensor and each reed switch have their own. Swapping a component = rewriting that one file, nothing else.
- **Interfaces never change. Drivers change.** `IMUSensor.h` is permanent. `IMUSensor_MPU6050.cpp` is replaceable. This is the contract.
- **No hardware constants in logic files.** GPIO pin numbers, I2C addresses, baud rates go in the driver file or a config header. Never hardcoded inside risk scoring or event logging.
- **Test logic without hardware.** Risk scoring, state machine, and event correlation must be testable on a laptop with mock data — no physical board required.
- **Changing a component should never require changing the app or backend.** Firmware swaps are internal. If swapping the GPS module requires a backend change, the architecture is wrong.
- **If you find yourself copy-pasting hardware code into two places, stop.** Extract it into a driver. One place only.
**Goal**: Everything unblocked before hardware arrives. API contract locked first.
---

## Week-by-Week Plan
| Task | Who | Status |
|---|---|---|
| Define event schema: event_id, device_id, sensor_type, timestamp, severity, payload, raw_hash | Both | — |
| Define API contract: POST /api/events, GET /api/timeline, GET /api/commands | Both | — |
| Define theft decision truth table (phone + key tag combinations) | Both | — |
| Architecture diagram: sensor → firmware → backend → app → alert | Both | — |
| GitHub repo initialized, folder structure, .gitignore (PlatformIO build files) | Both | — |
| Project board set up (GitHub Projects or Notion) | Both | — |
| Hardware ordered: ESP32-S3, MPU-6050, INMP441, relay modules, backup battery, GPS, LTE, key tag parts | Both | — |
| PlatformIO installed and verified on both machines (blink sketch) | E1 | — |
| Backend scaffold: Node.js/Express or Python/FastAPI decided and initialized | E2 | — |
| SQLite schema: events, devices, users, commands tables | E2 | — |

**Deliverable**: API contract document committed. Hardware ordered. Backend scaffold running locally. Both machines compile code.

---

### Week 2 — June 9–15: Backend Core + App Skeleton
**Goal**: Full event flow working with mock data end-to-end before hardware arrives.

| Task | Who | Status |
|---|---|---|
| POST /api/events — validation, storage, error responses | E2 | — |
| GET /api/timeline — returns events sorted by timestamp | E2 | — |
| GET /api/commands — polling endpoint for ESP32 | E2 | — |
| POST /api/commands — siren_on, siren_off, start_inhibit | E2 | — |
| Firebase Cloud Messaging: backend sends push notification to phone | E2 | — |
| Mobile app scaffold (React Native or Flutter — decide together) | E2 | — |
| App: alert screen — full-screen takeover, "It's me" / "Not me" buttons | E2 | — |
| App: "It's me / No theft" flow stops siren immediately and logs user action | E2 | — |
| App: siren policy setting (Aggressive default, Balanced optional) | E2 | — |
| App: dashboard — status, battery level, last location | E2 | — |
| ESP32: WiFi connection + HTTP POST of mock event to backend | E1 | — |
| ESP32: I2C scanner sketch — confirms wiring works before sensors arrive | E1 | — |

**Deliverable**: Mock event fired from ESP32 → backend stores it → push notification → app shows full-screen alert.

---

### Week 3 — June 16–22: IMU + Tilt Detection
**Goal**: Tilt detection working, parked baseline logic, impact classification.

| Task | Who | Status |
|---|---|---|
| Wire MPU-6050 to ESP32-S3 over I2C | E1 | — |
| Read raw accelerometer (X/Y/Z) + gyroscope values, print to Serial | E1 | — |
| Calculate tilt angle from accelerometer using arctan2 | E1 | — |
| Parked baseline: save tilt angle on engine-off; compare on next movement | E1 | — |
| Tilt threshold logic: delta > 8° from baseline → suspicious event | E1 | — |
| Impact detection: sudden acceleration spike → classify as crash vs theft start | E1 | — |
| Send tilt and impact events to backend over WiFi | E1 | — |
| Backend: risk scoring v1 — tilt + no-owner = HIGH, impact alone = DAMAGE | E2 | — |
| App: timeline screen showing events with severity colour codes | E2 | — |
| App: push notification for tilt event — correct alert level shown | E2 | — |

**Deliverable**: Tilt event fires correctly → backend scores risk → app notified. Stage 1 IMU bench test complete.

---

### Week 4 — June 23–29: Siren + Relay + Backup Battery
**Goal**: Physical protection hardware working. Power-cut survival confirmed.

| Task | Who | Status |
|---|---|---|
| Wire siren relay to ESP32 GPIO (3.3V GPIO → relay → 12V siren simulation) | E1 | — |
| Wire start inhibit relay to ESP32 GPIO (bench simulation of starter circuit) | E1 | — |
| Siren activation logic: fire immediately on high-risk threshold breach | E1 | — |
| Couple siren + critical notification trigger in the same event transaction | E1/E2 | — |
| Start inhibit: arm/disarm relay from firmware + from backend command | E1 | — |
| Next-start inhibit: arm on confirmed theft, fire when GPS speed < 8 km/h | E1 | — |
| Backup battery: detect main power cut via voltage divider on VIN | E1 | — |
| Power-cut event: log timestamp, send alert, switch to automatic low-power state machine, continue | E1 | — |
| Test: unplug main power → device stays on → event fires → alert sent | E1 | — |
| Backend: POST /api/commands received → ESP32 polls → executes siren/inhibit | E2 | — |
| App: manual siren trigger button | E2 | — |
| App: "Not me — confirm theft" → sends start_inhibit command | E2 | — |

**Deliverable**: Siren fires on tilt threshold. Power cut → backup battery → alert sent → tracking continues. Start inhibit relay works on command.

---

### Week 5 — June 30–July 6: GPS + LTE + Adaptive Tracking
**Goal**: Location tracking over LTE working. Offline buffering confirmed.

| Task | Who | Status |
|---|---|---|
| Wire Quectel BG95-M3 (GPS + LTE, one module) to ESP32 UART; bulk cap on supply | E1 | — |
| Enable GNSS + parse location: lat, lon, speed, heading | E1 | — |
| LTE-M HTTP POST: send events over cellular (failover from WiFi); LTE-M SIM required | E1 | — |
| Firmware power-state machine: Driving/Parked/Suspicious/Theft automatic modes | E1 | — |
| Adaptive ping rate: parked → 2h, suspicious → 60s, theft → 10s, low battery → 2m | E1 | — |
| SPIFFS local storage: buffer events when offline, upload on reconnect | E1 | — |
| Backend: GPS location history endpoint | E2 | — |
| Backend: battery status tracking endpoint | E2 | — |
| App: live map screen — last known location pin | E2 | — |
| App: "Trip data synced after temporary network loss" message on reconnect | E2 | — |

**Deliverable**: GPS tracking over LTE. Adaptive ping rate changes correctly. Events buffered offline and synced on reconnect.

---

### Week 6 — July 7–13: Guardian Key Tag + Authorization Logic
**Goal**: Full phone + key tag decision table working. Theft triggers correctly.

| Task | Who | Status |
|---|---|---|
| Key tag BLE pairing with ESP32 | E1 | — |
| Proximity detection: RSSI or UWB ranging — is key tag within ~5m? | E1 | — |
| Theft decision logic in firmware: phone + key table (all 4 combinations) | E1 | — |
| Backup PIN: firmware accepts PIN over BLE as fallback authorization | E1 | — |
| Grace mode: one-time start after biometric confirmation in app | E1 | — |
| Key tag battery level read + low-battery event (fire at ~20%, again at ~5%) | E1 | — |
| App: key tag pairing and management screen | E2 | — |
| App: household profiles — add/remove secondary authorized driver | E2 | — |
| App: "Find My Key" — send beep command to key tag | E2 | — |
| Backend: authorized key-only trip logged separately from theft events | E2 | — |
| App: household info notification — "Vehicle driven with key tag while phone away" | E2 | — |

**Deliverable**: All 4 phone/key-tag combinations behave correctly. Authorized trips logged. THEFT triggers immediately with no phone and no key tag.

---

### Week 7 — July 14–20: Full Firmware Integration + Authorized Modes
**Goal**: All sensors running together. Service, tow, and valet modes suppress false alerts.

| Task | Who | Status |
|---|---|---|
| Main firmware loop: IMU, GPS, LTE, key tag, power monitor all running concurrently | E1 | — |
| Event correlation: tilt + no-key + late night → higher risk score | E1 | — |
| Service mode: suppress hood/OBD/battery/movement alerts for fixed time window | E1 | — |
| Service mode: alert if car leaves set location during window | E1 | — |
| Tow approval mode: suppress tilt/movement on owner tap | E1 | — |
| OTA update blocked during active theft mode | E1 | — |
| App: service mode screen — set duration, optional location | E2 | — |
| App: tow approval mode — one-tap "I authorized towing" | E2 | — |
| App: valet mode — geofence + speed limit configuration | E2 | — |
| Backend: device mode state management (active mode per device) | E2 | — |
| Backend: crash vs theft classification — impact + follow-on event window | E2 | — |

**Deliverable**: All sensors fused. Service and tow modes suppress false alerts correctly. OTA blocked in theft mode.

---

### Week 8 — July 21–27: Police PDF + Risk Score + Privacy + Installer Checklist
**Goal**: All MVP user-facing features complete. Nothing missing from feature list.

| Task | Who | Status |
|---|---|---|
| Installer validation checklist: firmware runs each of 8 checks, reports pass/fail | E1 | — |
| Device health report: battery %, GPS signal, LTE bars, siren status | E1 | — |
| Backend: risk scoring engine — multi-factor (tilt + no-key + time + prior events) | E2 | — |
| Backend: police report PDF — all 8 evidence fields, SHA-256 hash chain | E2 | — |
| Backend: secure share link — time-limited, authenticated URL | E2 | — |
| App: "Generate Police Report" button + native share sheet | E2 | — |
| App: risk score explanation screen ("Why am I seeing this alert?") | E2 | — |
| App: privacy mode settings — Private / Balanced / Recovery / Always-on | E2 | — |
| App: installer validation checklist walkthrough UI | E2 | — |
| App: SMS/call backup trigger if push notification unacknowledged for 60 seconds | E2 | — |
| App: emergency contact notification if owner does not respond | E2 | — |

**Deliverable**: Complete MVP feature set in app. Police PDF correct. Privacy modes respected. Installer checklist passes on bench.

---

### Week 9 — July 28–August 3: Car Testing + Hardening
**Goal**: Real car, real scenarios, all edge cases verified. Known issues list.

| Test | Who | Status |
|---|---|---|
| Mount device + siren in car (underbody or bumper area) | Both | — |
| Installer validation checklist: pass all 8 checks in real car | Both | — |
| Tilt on hill: parked baseline saves correctly, no false alert while parked | Both | — |
| Tow simulation: tilt + movement + no key → siren fires, alert sent | Both | — |
| Power cut: unplug car battery → backup battery → alert → GPS continues | Both | — |
| Service mode: simulate mechanic actions → no false alert | Both | — |
| Underground parking: GPS drops → no theft alert, info log only | Both | — |
| Key tag present, no phone: authorized key-only trip logged, household notified | Both | — |
| No phone, no key tag: THEFT triggered immediately, siren fires | Both | — |
| Crash simulation: impact with no follow-on → damage alert only, not theft | Both | — |
| Police PDF: generate from real theft-scenario event chain, verify all fields | Both | — |
| Privacy mode Balanced: GPS not uploaded during normal authorized drive | Both | — |
| Stress test: all sensors firing simultaneously, no crashes or missed events | Both | — |
| Battery life test: run in theft mode, measure runtime (target: 48+ hours) | E1 | — |
| Alert latency: measure sensor trigger → phone alert time (target: < 3 seconds) | Both | — |

**Deliverable**: All Stage 1–3 scenarios verified. Known issues list. No critical blockers.

---

### Week 10 buffer — August 4–8: Bug Fixes + Demo Ready
**Goal**: Stable, demonstrable product. Feature freeze.

| Task | Who | Status |
|---|---|---|
| Fix all critical bugs from Week 9 car testing | Both | — |
| Alert latency < 3 seconds end-to-end confirmed | Both | — |
| Feature freeze: no new features added | Both | — |
| Internal demo: full theft scenario from tilt → siren → alert → PDF | Both | — |
| Repo cleaned: no secrets, build artifacts excluded, README updated | Both | — |
| Setup guide written: how to install, pair key tag, run installer checklist | Both | — |

**August 8: MVP complete. Ready for beta users.**

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hardware delayed (AliExpress) | Medium | High | Order from Amazon for Week 1 hardware; accept higher cost for speed |
| LTE modem integration harder than expected | Medium | High | Start WiFi-only, add LTE in Week 5 without blocking other work |
| Key tag UWB ranging unreliable | Medium | Medium | Fall back to BLE RSSI proximity if UWB is too complex for MVP |
| False positives in car testing | Medium | High | Multi-signal escalation rules already defined; tune thresholds in Week 9 |
| Backup battery life < 48 hours | Low | High | Use 5000–7000 mAh Li-ion + BQ24074 power-path charger; measure current in Week 4 |
| OTA update during theft mode | Low | High | Block OTA in firmware; already planned in Week 7 |

---

## What MVP Does NOT Include (V1.5+)

These are cut from MVP to hit August 8. Do not scope creep:
- OBD tamper detection
- Jamming detection
- Valet mode (geofenced monitoring)
- Household access profiles
- Door/hood/trunk sensor correlation
- Cryptographic evidence lock
- Insurance export

**Let's build this.**

NOTE: Microphone / glass break sprint REMOVED. Glass break is Nice-to-Have (post V1.5).
INMP441 mic arriving June 15-25 — keep it as a passive evidence sensor only.
No firmware work for audio detection until after V1.5 ships.

#### Sprint 1.3: GPS & OBD Integration Study (Week 5)
- **Team**: Both engineers (pair programming then knowledge segregation)
- **Focus**: Learn comms protocols, then work separately with code review

| Task | Both | Status |
|------|-------|--------|
| Research UART, SPI, CAN protocols together | ✓ | — |
| Review Quectel BG95-M3 datasheet (GPS + LTE-M, AT commands) | ✓ | — |
| Review SN65HVD230 CAN transceiver datasheet | ✓ | — |
| **Engineer-One**: Wire GPS, implement UART driver | E1 | — |
| **Engineer-Two**: Wire CAN transceiver (ESP32 TWAI + SN65HVD230), implement driver | E2 | — |
| Pair: Code review each other's implementation | ✓ | — |
| Integration: Both test GPS + CAN together on breadboard | ✓ | — |
| **Milestone**: Stage 1 GPS + OBD bench test complete ✓ | ✓ | — |

**Deliverable**: GPS driver, OBD/CAN driver, integration tested

**Learning Goal**: Both understand UART/SPI/CAN, async comms, protocol parsing

#### Sprint 1.4: Full Firmware Integration + Backend MVP (Week 6)
- **Team**: Both engineers (integrated work)
- **Focus**: Bring all sensors together, ship first API endpoint

**Firmware Work**:
| Task | Both | Status |
|------|------|--------|
| Combine all 4 sensor drivers into main firmware loop | ✓ | — |
| Implement event logging to local storage (SD card or SPIFFS) | ✓ | — |
| Add timestamp, sequence IDs, and basic error handling | ✓ | — |
| Test all sensors firing simultaneously | ✓ | — |

**Backend Work**:
| Task | Both | Status |
|------|------|--------|
| Choose backend stack (Node.js/Express or Python/FastAPI) | ✓ | — |
| Set up basic server skeleton and database | ✓ | — |
| Design event schema (which fields, timestamps, IDs) | ✓ | — |
| Implement `/api/events` POST endpoint | ✓ | — |
| Add request validation and error responses | ✓ | — |

**Integration**:
| Task | Both | Status |
|------|------|--------|
| Firmware: Add WiFi + HTTP client to send events | ✓ | — |
| Backend: Log each incoming event to database | ✓ | — |
| End-to-end: Firmware sends sensor event → backend logs it | ✓ | — |
| **Milestone**: Integrated firmware + working backend API ✓ | ✓ | — |

**Deliverable**: Firmware with all sensors, backend with event ingestion API, end-to-end flow working

**Learning Goal**: Both understand full integration, WiFi on ESP32, REST API design

---

### Phase 2: Mobile App & Risk Engine (Weeks 7–10)
**Goal**: Mobile app receives alerts, risk scoring logic works, evidence vault prototype

#### Sprint 2.1: Mobile App & Push Notifications (Week 7)
- **Team**: Both engineers (learning app framework together)
- **Focus**: Ship first alert to phone

| Task | Both | Status |
|------|------|--------|
| Decide on framework together (React Native vs Flutter) | ✓ | — |
| Set up project scaffold for chosen framework on both machines | ✓ | — |
| Learn Firebase / push notification fundamentals together | ✓ | — |
| Set up push notification service (Firebase Messaging) | ✓ | — |
| Design alert screen UI mockup together | ✓ | — |
| **Engineer-One**: Implement alert screen UI in app | E1 | — |
| **Engineer-Two**: Implement backend notification route | E2 | — |
| Pair: Test push notification → alert on phone | ✓ | — |
| **Milestone**: Receive push notification on phone ✓ | ✓ | — |

**Deliverable**: Working mobile app, push notification working, alert UI

**Learning Goal**: Both understand app development stack, push notifications, app lifecycle

#### Sprint 2.2: Evidence Vault & Cryptography (Week 8)
- **Team**: Both engineers (learning cryptography together)
- **Focus**: Build tamper-proof evidence logging

| Task | Both | Status |
|------|-------|--------|
| Research cryptographic hashing and signing together | ✓ | — |
| Learn SHA-256 and digital signatures basics | ✓ | — |
| **Firmware**: Implement SHA-256 evidence hashing on ESP32 | E1 | — |
| **Backend**: Implement signature verification and storage | E2 | — |
| Pair: Code review crypto implementation | ✓ | — |
| Test evidence tampering detection together | ✓ | — |
| Document evidence schema and audit trail | ✓ | — |
| **Milestone**: Evidence vault prototype locked ✓ | ✓ | — |

**Deliverable**: Evidence hashing, locked log vault, backend verification, documentation

**Learning Goal**: Both understand cryptography, hash functions, audit trails

#### Sprint 2.3: Risk Scoring & Timeline (Week 9)
- **Team**: Both engineers (learning data analysis + UX)
- **Focus**: Build intelligent threat scoring

| Task | Both | Status |
|------|-------|--------|
| Design risk scoring algorithm together (what factors matter) | ✓ | — |
| Learn about multi-factor decision making models | ✓ | — |
| **Backend**: Implement risk scoring logic (relay, tow, unauthorized start) | E2 | — |
| **App**: Build timeline UI to show events in order | E1 | — |
| **Backend**: Add `/api/timeline` endpoint with events + risk scores | E2 | — |
| **Firmware**: Add event correlation (e.g., "unlocked + tilted + 2am") | E1 | — |
| Pair: Test full theft scenario, check risk score accuracy | ✓ | — |
| **Milestone**: Generate & verify risk scores ✓ | ✓ | — |

**Deliverable**: Risk scoring logic, timeline UI, event correlation

**Learning Goal**: Both understand risk assessment, data correlation, decision trees

#### Sprint 2.4: Police Report & Battery Management (Week 10)
- **Team**: Both engineers (parallel work, then integration)
- **Focus**: Complete MVP features

**PDF Generation & Sharing**:
| Task | Both | Status |
|------|------|--------|
| Research PDF generation libraries for backend | ✓ | — |
| **Backend**: Implement police report PDF generation | E2 | — |
| **Backend**: Add secure link generation (time-limited, authenticated) | E2 | — |
| **App**: Add "Generate Police Report" button to alert screen | E1 | — |

**Battery Management**:
| Task | Both | Status |
|------|-------|--------|
| Research power management techniques for ESP32 | ✓ | — |
| **Firmware**: Implement power-mode switching (active / normal / sleep) | E1 | — |
| **Firmware**: Add wake-on-movement interrupt handling | E1 | — |
| **Backend**: Implement `/api/battery-status` tracking | E2 | — |

**Integration & Verification**:
| Task | Both | Status |
|------|-------|--------|
| Pair: Test battery drain over 24 hours | ✓ | — |
| Simulate theft scenario → generate PDF → share link | ✓ | — |
| **Milestone**: MVP feature set complete ✓ | ✓ | — |

**Deliverable**: Police report PDF, secure sharing, battery management, 48+ hour runtime

**Learning Goal**: Both understand PDF generation, power optimization, security/auth

---

### Phase 3: Car Testing & Refinement (Weeks 11–14)
**Goal**: Successful field & drive tests, MVP feature complete, reliability verified

#### Sprint 3.1: Power Test in Parked Car (Week 11)
**Team**: Both engineers (on-site testing + monitoring)

From `testing-stages.md` Stage 3:

| Task | Both | Status |
|------|------|--------|
| Review power test checklist from testing-stages.md | ✓ | — |
| Prepare breadboard for car installation (waterproof, vibration protection) | ✓ | — |
| Install device in safe location in car | ✓ | — |
| Cut USB power, verify OBD-II port powers device | ✓ | — |
| Monitor Serial logs over WiFi / remote connection | ✓ | — |
| Check battery drain rate for 8 hours | ✓ | — |
| Manually simulate theft event (tilt, unlock, start) | ✓ | — |
| Verify alert triggers on phone | ✓ | — |
| Document all findings and issues | ✓ | — |
| **Milestone**: Stage 3 power test complete ✓ | ✓ | — |

**Deliverable**: Power stability verified, alert flow confirmed, test logs

**Learning Goal**: Both understand car integration challenges, real-world debugging

#### Sprint 3.2: Field Testing - Parked Car (Week 12)
**Team**: Both engineers (one in car, one monitoring remotely)

From `testing-stages.md` Stage 4:

| Task | Both | Status |
|------|-------|--------|
| Plan relay attack simulation (key amplifier proximity test) | ✓ | — |
| **In-car**: Simulate relay attack scenario | E1 | — |
| **Remote**: Monitor backend for correct risk scoring | E2 | — |
| Pair: Verify alert received within 2 seconds | ✓ | — |
| Test forced entry detection (unlock without start) | ✓ | — |
| Test glass break detection (actual window with cloth to be safe) | ✓ | — |
| Test tow/tilt detection (manually tilt car with jack - safety protocol) | ✓ | — |
| Verify siren alert bypasses silent + DND mode | ✓ | — |
| Collect failure scenarios and document | ✓ | — |
| **Milestone**: All field tests pass ✓ | ✓ | — |

**Deliverable**: Tested relay attack, forced entry, glass break, field test report

**Learning Goal**: Both understand end-to-end scenario testing, false positive rates

#### Sprint 3.3: Drive Testing (Week 13)
**Team**: Both engineers (rotating driver + monitor)

From `testing-stages.md` Stage 5:

| Task | Both | Status |
|------|-------|--------|
| Review drive test safety checklist | ✓ | — |
| **Drive**: Short neighborhood route with all systems on | E1 | — |
| **Monitor**: Watch backend GPS, events, battery from laptop | E2 | — |
| Verify GPS accuracy compares to actual route | ✓ | — |
| Verify location updates every 30 seconds (while moving) | ✓ | — |
| Monitor event logging for false positives | ✓ | — |
| **Drive**: Simulate unauthorized start scenario (safe parking lot) | E1 | — |
| **Monitor**: Verify unauthorized start detected + alert sent | E2 | — |
| Document any edge cases or surprises | ✓ | — |
| Swap roles and repeat (both get experience) | ✓ | — |
| **Milestone**: Drive test complete, adaptive pinging verified ✓ | ✓ | — |

**Deliverable**: Tested in real driving, GPS accuracy verified, event logging solid

**Learning Goal**: Both understand real-world performance, edge cases, optimization needs

#### Sprint 3.4: Polish & MVP Release Prep (Week 14)
**Team**: Both engineers (joint effort, shared responsibility)

| Task | Both | Status |
|------|-------|--------|
| Review all bugs and issues found in Weeks 11–13 | ✓ | — |
| Prioritize fixes (critical, high, medium) | ✓ | — |
| **Divide**: Each engineer picks critical bugs to fix | Split | — |
| Code review each other's bug fixes | ✓ | — |
| Implement remaining MVP features (relay, tow, unauthorized start) | ✓ | — |
| Polish app UI: dark mode, accessibility, responsiveness | ✓ | — |
| Final backend risk scoring tuning | ✓ | — |
| Write firmware release notes and version | ✓ | — |
| Write app release notes and version | ✓ | — |
| Create short video demo: "Here's what Guardian Drive does" | ✓ | — |
| Full end-to-end smoke test (all systems) | ✓ | — |
| **Milestone**: MVP ready for beta release ✓ | ✓ | — |

**Deliverable**: MVP release candidate v1.0, demo video, release notes

**Learning Goal**: Both understand release management, QA, and what "ready to ship" means

---

## Collaborative Learning Model

### How This Works

Since both of you are learning the tech together, the plan uses **pair programming + rotation**:

1. **Pair Programming (75% of time)**
   - Both at one desk, one coding, one observing & suggesting
   - Greatly accelerates learning and catches mistakes early
   - Builds shared understanding of every component

2. **Parallel Work with Code Review (25% of time)**
   - In Week 3–5 and 11–14, some tasks can split
   - **One person**: Firmware sensor driver
   - **Other person**: Backend API endpoint or app screen
   - **Always**: 15-min code review before merging
   - This way you both know every part of the codebase

3. **Rotation Rule**
   - Every sprint, swap who's "leading" the research
   - If Engineer One researched cryptography, Engineer Two leads the next topic
   - Nobody becomes the "person who knows X" — you both know everything

### Knowledge Transfer Sessions

- **Weekly 15-min sync**: Review what was learned, blockers, next sprint
- **Before each sprint**: 10-min reading session on the new tech (datasheet, tutorial, etc.)
- **When stuck**: Immediate pair programming session to debug together

### Code Organization

Keep code **organized for learning**:
- **Firmware**: Separate file per sensor with clear comments
- **Backend**: One file per major feature (risk scoring, PDF generation, etc.)
- **App**: By view/component with descriptive naming
- **Docs**: Decisions documented (why we chose this approach, not that one)

### Benefits of This Approach

✅ Both understand the entire system (no silos)  
✅ Faster debugging (two pairs of eyes)  
✅ Easier to split work when hardware arrives  
✅ Better code quality from built-in review  
✅ Less stress if one person gets sick or busy  
✅ Both can demo the product to friends/investors  

### Gear & Setup

- **Shared workspace**: One desk with 2 chairs, 1 big monitor (or 2 monitors)
- **Separate dev machines**: Each has full dev environment (for parallel work weeks)
- **Shared hardware kit**: One bench with all sensors, breadboards, tools
- **Communication**: Slack/Discord for quick updates, 30-min weekly calls

---

## Tools & Infrastructure Setup

### Version Control & Collaboration
```
GitHub:
├── firmware/          (Engineer A primary)
├── app/               (Engineer B primary)
├── backend/           (Engineer B primary)
├── hardware/          (shared docs)
├── docs/              (shared)
└── .github/workflows/ (CI/CD for testing)
```

### Project Tracking
- GitHub Projects or Notion for sprint boards
- Weekly 30-min sync meeting (status update)
- Asynchronous updates in #project-status Slack/Discord

### Hardware Storage
- Shared component organizer with labeled bins
- One "Bench A" setup, one "Bench B" setup (avoid conflicts)
- Dedicated USB hub for programmers

### Backend Hosting (MVP)
- Firebase / Heroku / Railway (free tier for prototype)
- Simple PostgreSQL or MongoDB for events

### Testing Environment
- Simulated car garage or parking lot nearby
- Relay attack simulator (software-based key amplifier emulator)
- Test keys and spare batteries

---

## Success Criteria

### Phase 0 ✓
- [ ] All hardware ordered and arriving
- [ ] Dev environments identical on both machines
- [ ] Git repo with branch strategy documented

### Phase 1 ✓
- [ ] All 5 sensors work individually
- [ ] Firmware compiles and runs
- [ ] Backend accepts events from firmware

### Phase 2 ✓
- [ ] App receives push notification from backend
- [ ] Risk scoring algorithm produces reasonable scores
- [ ] Evidence vault stores & verifies hashes

### Phase 3 ✓
- [ ] Device powers from OBD-II in real car
- [ ] Relay attack detected reliably
- [ ] Owner receives alert within 2 seconds
- [ ] Police PDF generates instantly

---

## Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Hardware delays | High | Order early (Week 1), prioritize ESP32 + IMU first |
| Firmware complexity | High | Use Arduino libraries, test each sensor in isolation |
| Backend database scaling | Medium | Start simple (SQLite or Firebase), migrate later |
| LTE connectivity unreliable | Medium | Implement local silent mode buffer + retry logic |
| Two-person team burnout | High | 2-week sprints, hard stop Fridays, code review to avoid silos |
| Car access limited | Medium | Simulate on breadboard first, partner/friend's car for Stage 4+ |

---

## Next Immediate Actions (Week 1)

**Pair programming for all of these (sit together)**:

1. **Day 1**: Together, review this plan, adjust if needed
2. **Day 1–2**: Set up GitHub repo together, create project board
3. **Day 2–3**: Finalize hardware BOM together, submit order
4. **Day 3–5**: Install PlatformIO + Arduino IDE on both machines simultaneously (in same room)
5. **Day 5**: Test: both compile a simple "blink" sketch for ESP32-S3
6. **Week 2**: Architecture design session (whiteboard → diagram → doc)

**Goal for Week 1 end**: Both machines ready, hardware ordered, repo set up, same dev environment

---

## Success Message

In **14 weeks** with focused 2-week sprints, you'll have:
- A working ESP32-based theft detection device
- Real-time mobile alerts with cryptographic evidence
- Police report generation
- 48+ hour backup battery
- **MVP ready to beta test**

From there: refinement, reliability hardening, production hardware selection.

**Let's build this.** 🚗
