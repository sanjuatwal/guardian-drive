# Guardian Drive

> "Know before your car is stolen."

## What This Project Is

Guardian Drive is a hardware + software anti-theft system built specifically for the GTA vehicle theft problem. It is not just a tracker. It detects theft attempts in real time, alerts the owner immediately, preserves tamper-proof evidence, and keeps tracking even if the thief cuts the power or jams the signal.

Most products answer: "Where is my stolen car?"
This product answers: "Someone is trying to steal your car right now."

---

## Project Status

Currently in: **Pre-Prototype / Planning Phase**

Next step: Order hardware components (see `hardware/BOM.md`) and begin Stage 1 bench testing.

---

## Folder Structure

```
guardian-drive/
├── README.md                  ← you are here (master project context)
├── docs/
│   ├── feature-document.md    ← full product feature list and tiers
│   └── testing-stages.md      ← Stage 1–5 bench to car testing guide
├── hardware/
│   └── BOM.md                 ← full parts list with prices and order priority
├── firmware/                  ← ESP32 / embedded code will go here
├── app/                       ← mobile app code will go here
└── backend/                   ← cloud API and risk engine will go here
```

---

## Product Summary (from planning conversation)

### The Problem
- Current products notify AFTER theft or help RECOVER a stolen car
- GTA auto theft is one of the highest in North America
- Relay attacks, tow theft, and driveway theft are high-anxiety unsolved problems for most owners

### The Solution
A three-layer system:
1. **Car Guardian Unit** — hidden hardware device inside the vehicle
2. **Key Shield Unit** — small puck near the keys at home to detect relay attacks
3. **Mobile App** — real-time alerts, risk scores, theft mode, evidence export

### Core Detection Features
- Relay attack detection (key home + car unlocked + phone absent)
- Glass break and forced-entry detection
- Tow / jack / tilt detection
- Unauthorized start detection
- OBD tamper and power-cut detection
- GPS/LTE jamming detection

### What Happens During a Theft Attempt
1. Thief approaches and amplifies key signal
2. Device detects: car unlocked, owner phone not nearby, 2 AM
3. Risk Engine scores the event (e.g. 94%)
4. Phone screams full-volume siren alert bypassing silent mode
5. Owner taps "Theft Confirmed"
6. Evidence vault locks all logs with cryptographic hash
7. GPS activates, LTE pings every 10 seconds
8. One-tap police PDF generated instantly
9. Time-limited secure link shared with police or insurance

---

## Product Tiers

| Tier | Focus |
|---|---|
| **MVP** | Relay attack, tow/tilt, unauthorized start, live tracking, backup battery, timeline, police pack |
| **V1.5** | Jamming detection, OBD tamper, door/hood correlation, valet/service mode, adaptive risk scoring |
| **V2** | Insurance integrations, community recovery network, fleet console, optional immobilizer |

---

## Hardware Overview

Main processor: **ESP32-S3** (prototype), target nRF52 or STM32 for production

Key sensors:
- IMU: MPU-6050 (tow / tilt / impact)
- Microphone: INMP441 MEMS (glass break)
- GPS: u-blox NEO-6M / NEO-M9N
- LTE: SIM7600G-H
- OBD: MCP2515 CAN Bus module
- Backup battery: LiPo 3.7V 2000–3000mAh

Estimated prototype cost: $80–220 depending on scope.

Full parts list: see `hardware/BOM.md`

---

## Testing Plan

Never test directly in the car. Always progress through stages:

1. **Bench** — each sensor alone, USB power, Serial Monitor
2. **Integration** — all sensors together on desk
3. **Power test** — OBD port power only, parked car
4. **Field test** — full breadboard in parked car, manual simulation
5. **Drive test** — only after all prior stages pass

Full checklist: see `docs/testing-stages.md`

---

## Key Design Decisions Made

- Start with ESP32-S3 for firmware development speed
- OBD-II pass-through for power, no wire cutting
- Backup battery target: 48–72 hours minimum in theft mode
- Cryptographic hash evidence lock for insurance/legal defensibility
- Emergency phone siren bypasses silent and do-not-disturb modes
- Silent evidence mode buffers logs locally when LTE/GPS is jammed
- Adaptive ping rate: 10s active theft, 30s moving, 2min parked

---

## Next Steps

- [ ] Order hardware from `hardware/BOM.md` (start with ESP32-S3 + MPU-6050)
- [ ] Set up Arduino IDE or PlatformIO for ESP32 firmware development
- [ ] Complete Stage 1 bench test for IMU
- [ ] Add glass break audio classifier to mic
- [ ] Design backend API schema for event ingestion and risk scoring
- [ ] Prototype mobile app alert screen (React Native or Flutter)
