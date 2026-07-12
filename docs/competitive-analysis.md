# Guardian Drive — Competitive Analysis

> Each competitor has one strong part. Our product brings multiple strong parts together into one smart theft-recovery flow.

## How to read this document

This is a **positioning artifact**, not a defensibility argument. Every feature listed below as
a Guardian Drive strength is, on its own, copyable by any one of these competitors — see
`docs/patents-and-ip-strategy.md` for what actually protects Guardian Drive long-term (trade
secrets, data moat, speed to market, partnerships), which is a separate and more important
question than "do we have more features."

**Built vs. planned:** this map describes the target product, not the current build. Items are
tagged against `docs/feature-document.md`'s tiers:
- 🟢 **Built or in active development** (current firmware/backend/app work)
- 🟡 **Documented, MVP-scoped, not yet built**
- 🔵 **Documented, V1.5/V2-scoped** (e.g., Hijack Mode, OBD tamper detection)

Don't use the "Yes" column below in external marketing without checking a feature's actual tag
in `feature-document.md` first — several rows describe the target spec, not shipped behavior.

---

# Guardian Drive feature bundle

```text
Guardian Drive =
CarLock-style 4G/GPS alerts
+ Monimoto-style key tag absence logic
+ KēZ/IGLA-style immobilizer thinking
+ StarLine-style hijack mode idea
+ EASYGUARD-style shock/door/siren alarm layer
+ our own biometric-gated Hijack Mode + safe next-restart blocking workflow
```

---

# Feature-by-feature comparison

| Feature | Guardian Drive | Status | Competitors with similar part |
| --- | --- | --- | --- |
| 4G/LTE GPS tracking | Yes | 🟡 MVP, BG95-M3 hardware not yet ordered | CarLock, DroneMobile, Monimoto, TAG, some IGLA/Author telematics |
| Phone app alerts | Yes | 🟢 Built (push + WebSocket live alerts) | CarLock, DroneMobile, Monimoto, KēZ, StarLine |
| OBD plug-and-play alert device | Maybe / optional | 🔵 V1.5, read-only by design (Section 1) | CarLock is strongest here |
| Vibration/shock detection | Yes | 🟡 MVP, shock sensor not yet ordered | CarLock, EASYGUARD, Compustar/DroneMobile alarms |
| Vehicle moved alert | Yes | 🟢 Built (tilt detection) | CarLock, Monimoto, DroneMobile |
| Engine started alert | Yes | 🟡 MVP-adjacent (unauthorized start detection) | CarLock |
| Device disconnected alert | Yes | 🟡 MVP (power-cut detection, Section 2) | CarLock |
| Battery health monitoring | Optional | 🟡 MVP (backup battery status) | CarLock, DroneMobile app |
| Key tag / owner presence logic | Yes | 🟢 Built (BLE phone proximity); Key Tag hardware ordered, firmware not started | Monimoto, StarLine, Ghost/IGLA-style systems |
| Door open detection | Yes | 🟡 MVP, reed switches not yet ordered | EASYGUARD, traditional alarms |
| Hood/tailgate trigger | Optional | 🟡 MVP, reed switch not yet ordered | EASYGUARD, traditional alarms |
| Tilt/tow/jack detection | Yes | 🟢 Built | Compustar-type alarm systems, some trackers |
| Siren / warning chirps | Yes | 🟢 Built (relay-driven, remote trigger) | EASYGUARD, Compustar, StarLine |
| Suspicious Watch Mode | Yes | 🟢 Built (`kSuspicious` state) | Not clearly seen as a named flow elsewhere |
| User-confirmed Theft Mode | Yes | 🟢 Built | Partial in app-based systems, but not the same two-layer logic |
| Hijack Mode (owner-initiated duress trigger) | Yes | 🔵 V1.5, documented 2026-06-22 (feature-document.md Section 3) | StarLine has app/SMS/account anti-hijack activation |
| Biometric confirmation before "It's me" stand-down AND before Hijack Mode activation | Yes | 🔵 Stand-down gate is MVP-documented; Hijack-Mode gate is V1.5 | Not clearly marketed in the products checked |
| Safe next-restart block | Yes | 🟡 MVP design done (Section 3), harness hardware not yet built | Similar immobilizer idea in KēZ, IGLA, Ghost, StarLine, DroneMobile/Compustar starter-kill setups |
| Does not kill moving car | Yes, core safety rule | 🟢 Enforced in firmware (speed gate) | Some systems block below a speed threshold; our rule is stricter — Hijack Mode included |
| Service/mechanic mode | Yes | 🟢 Built (maintenance mode: service/valet/towing) | Ghost, KēZ, EASYGUARD valet mode, StarLine maintenance mode |
| Evidence/event timeline | Yes | 🟢 Built (event log + risk scoring) | Partial in CarLock, DroneMobile, Monimoto |
| Hidden install / harder to remove | Yes, goal | 🟡 MVP (installer checklist), no enclosure yet | IGLA, Ghost, TAG, Monimoto |
| Insurance-friendly anti-theft positioning | Yes, goal | 🔵 Long-term — requires the partnerships/data-moat path, not a feature | KēZ, TAG, IGLA, Ghost |

CarLock already has 4G/GPS, vibration, movement, engine-start, disconnect, trip, and battery alerts. ([Amazon][1]) DroneMobile offers app control, GPS tracking, security/alarm alerts, family sharing, car finder, and speed monitoring. ([Compustar][2]) Monimoto specifically uses movement detection plus paired key-fob absence to trigger alarm mode and location tracking. ([Monimoto][3]) KēZ uses app-based two-factor authorization with the factory key fob before the vehicle can be driven. ([Canadian Tire][4]) StarLine has anti-hijack activation from app/SMS/account and can block when speed drops below a threshold. ([Starline][5])

---

# Competitor-by-competitor breakdown

## 1. CarLock

**What it brings:**
- 4G GPS tracking
- OBD plug-and-play
- Vibration alert
- Vehicle moved alert
- Engine-start alert
- Device-disconnect alert
- Trip tracking
- Battery monitoring
- Teen/fleet driving alerts

**What it does not bring strongly:**
- Key tag presence logic
- Door/hood magnetic sensor logic
- Siren control
- Hijack Mode
- Biometric emergency confirmation
- Restart blocking / immobilizer harness

**Our difference vs CarLock:**
> CarLock tells you something happened.
> Guardian Drive should detect, confirm, track, escalate, and block next restart.

CarLock is our **closest GPS/app alert competitor**. ([Amazon][1])

---

## 2. KēZ by Keyfree Technologies

**What it brings:**
- Immobilizer
- App authorization
- Two-factor vehicle security
- Factory key + KēZ authorization required
- Plug-in/no-wiring positioning
- Multiple drivers
- Insurance-friendly positioning

Canadian Tire describes KēZ as requiring both the factory key fob and KēZ authorization before the vehicle can be driven. KēZ's own site describes installing a vehicle-compatible immobilizer, using the mobile app, and activating 2FA security. ([KEZ][6])

**What it does not bring strongly:**
- Shock/vibration alert
- Door-open detection
- Siren
- GPS theft recovery flow, depending on model
- Suspicious Watch Mode
- Hijack Mode with live recovery flow
- Event-based theft scoring

**Our difference vs KēZ:**
> KēZ prevents unauthorized driving.
> Guardian Drive should detect the theft attempt, alert the user, track the vehicle, and then prevent restart.

KēZ is our **closest immobilizer competitor**.

---

## 3. Monimoto

**What it brings:**
- Hidden GPS tracker
- Cellular/eSIM tracking
- Key fob presence logic
- Movement without key fob = alarm
- App notification / phone call
- Battery-powered hidden design

Monimoto says it tracks the vehicle when movement is detected and the paired key fob is not nearby. ([Monimoto][3]) It also says the tracker checks for the key fob when movement is detected and enters alarm mode if the key fob cannot be found. ([Monimoto][7])

**What it does not bring strongly:**
- OBD engine-start alert
- Door-open sensor
- Siren
- Starter/restart blocking
- Hijack Mode
- Biometric emergency flow
- Integration with car harness

**Our difference vs Monimoto:**
> Monimoto is excellent at hidden tracking and key-fob absence detection.
> Guardian Drive adds vehicle-event sensors and safe restart blocking.

Monimoto is our **closest key-tag + movement competitor**.

---

## 4. DroneMobile / Compustar

**What it brings:**
- Smartphone vehicle control
- Remote start
- Keyless entry
- Security/alarm alerts
- GPS tracking
- Trip history
- Speed/geofence monitoring
- Can integrate with Compustar alarm/starter-kill systems

DroneMobile describes app-based remote start, security, GPS tracking, and alarm monitoring. ([DroneMobile][8]) Its subscription page lists smartphone security alerts, GPS tracking, trip history, and vehicle control depending on plan. ([DroneMobile][9])

**What it does not bring strongly:**
- Our exact key tag + door + shock + tilt theft-decision logic
- Biometric-gated Hijack Mode
- Explicit "wait until stopped/off, then block next restart" positioning
- Privacy-first/camera-free evidence timeline as core concept

**Our difference vs DroneMobile:**
> DroneMobile is powerful but feels like remote start + alarm + GPS.
> Guardian Drive should feel like smart theft confirmation + recovery control.

DroneMobile/Compustar is our **closest full-system competitor**.

---

## 5. StarLine

**What it brings:**
- App/SMS/account anti-hijack activation
- Tag-loss logic
- Siren/hazard warning
- Engine blocking below a speed threshold
- Maintenance/service mode
- Security telematics

StarLine's manual says Anti-Hijack can be activated by owner command or tag loss, including from the mobile app, and then can block when speed falls below 30 km/h. ([Starline][5])

**What it does not bring exactly like ours:**
- Our strict "do not stop moving car; only block next restart after stopped/off" rule
- Biometric-gated activation as a visible safety/anti-misuse layer
- Silent-by-default duress mode (no siren) — StarLine's anti-hijack doesn't make this distinction explicit
- Simpler consumer-friendly Canadian positioning
- Our planned sensor fusion flow

**Our difference vs StarLine:**
> StarLine already has a serious anti-hijack feature.
> Guardian Drive's Hijack Mode makes it safer: biometric-gated to prevent misuse, silent by default since the owner may be physically present and at risk, and still bound by the same "never stop a moving car" rule as every other path.

StarLine is our **closest anti-hijack competitor**, and the direct inspiration for Guardian Drive's Hijack Mode (feature-document.md Section 3).

---

## 6. IGLA / Ghost Immobilizer

**What they bring:**
- Hidden immobilizer
- PIN-to-drive / factory button sequence
- Protection against relay attacks, key cloning, OBD theft
- Stealth CAN-bus install
- Service/valet mode
- Optional tags/app depending on model

IGLA Canada describes hidden PIN-to-drive protection against relay attacks, key cloning, and OBD theft. ([IGLA Canada][10]) Autowatch Ghost-II lists secret disarm sequence, stealth CAN-bus integration, service/valet mode, and optional app/tags. ([Autowatch][11])

**What they do not bring strongly:**
- Consumer app theft timeline
- GPS recovery as core feature, unless paired with extra telematics
- Shock/door/tilt multi-sensor alert flow
- Hijack Mode with biometric gate
- User-facing suspicious watch workflow

**Our difference vs IGLA/Ghost:**
> IGLA/Ghost stop the thief from driving.
> Guardian Drive should also detect, alert, track, log, and guide the owner.

IGLA/Ghost are our **closest stealth immobilizer competitors**.

---

## 7. TAG Tracking

**What it brings:**
- Hidden vehicle recovery system
- Anti-jamming focus
- Recovery team
- Insurance-friendly positioning
- RFID/nano-transponder style tracking
- Harder for thieves to find/remove

TAG says it uses anti-jamming technology with a secure communication protocol. ([Tag Tracking][12]) Speedy Glass describes TAG as a vehicle tracking system recognized by insurance companies and says tracking is handled by TAG's team with owner consent and law enforcement event number. ([Speedy Glass][13])

**What it does not bring strongly:**
- User-controlled app theft mode
- Door/shock/tilt alerts
- Key tag presence logic
- Siren
- Restart blocking
- Biometric-gated emergency actions

**Our difference vs TAG:**
> TAG is recovery-service focused.
> Guardian Drive is owner-facing detection + recovery + safe immobilization.

TAG is our **closest recovery/insurance competitor** in Canada — and the clearest example of why the insurance-recognition path (not feature count) is the real long-term moat (see `docs/patents-and-ip-strategy.md`).

---

## 8. EASYGUARD EC203

**What it brings:**
- 2-way LCD pager
- Shock sensor
- Ultrasonic cabin sensor
- Door/hood/tailgate/ACC triggers
- Siren/alarm functions
- Panic/car finding
- Valet mode
- Anti-hijacking feature

The EASYGUARD listing includes LCD pager, ultrasonic sensor, shock sensor, door intrusion alarm, ACC trigger, hood/tailgate trigger, anti-hijacking, panic mode, valet mode, and other traditional alarm functions.

**What it does not bring strongly:**
- LTE app tracking
- GPS recovery
- Key tag / phone presence logic
- Biometric confirmation
- Safe next-restart block
- Modern app timeline
- Easy install

**Our difference vs EASYGUARD:**
> EASYGUARD is a traditional alarm.
> Guardian Drive is a smart connected theft-recovery system.

---

# Final "what are we bringing together?"

| Guardian Drive feature | Why it matters |
| --- | --- |
| 4G/LTE GPS tracking | Track car live after theft |
| Phone app control | Owner gets alerts and can respond |
| Bluetooth key tag / phone-key presence | Know if authorized person is nearby |
| Shock/vibration sensor | Detect forced entry attempt |
| Tilt/tow detection | Detect jacking, towing, wheel theft |
| Door/hood magnetic sensor | Confirm real access, not just vibration |
| OBD/ACC/engine event detection | Know if car started or ignition changed |
| Suspicious Watch Mode | Warn before full alarm/theft escalation |
| Siren chirps / alarm output | Deter thief locally |
| Theft Recovery Mode | Escalate GPS, logging, alerts |
| Hijack Mode from app | Handle a carjacking the sensor truth table can't see (owner's phone/key are in the car) |
| Biometric confirmation | Gate deliberate manual actions (stand-down, Hijack Mode) against misuse — never gates the automatic sensor-triggered path |
| Safe next-restart block | Do not stop moving car; block thief after they turn it off |
| Backup battery | Keep device alive after car battery/device disconnect |
| Service Mode | Mechanic can work without false alarms |
| Event timeline/evidence log | Owner can see what happened and when |
| Hidden modular install | Harder for thief to find/remove |

---

# The one-line product definition

> **Guardian Drive is a smart anti-theft recovery system that combines GPS tracking, key-presence detection, vehicle-event sensing, biometric-gated emergency control (including Hijack Mode), and safe next-restart immobilization into one app-guided theft response flow.**

That combination is the real value — but per the note at the top of this document, the combination is a **positioning** story. What actually keeps a competitor from copying it once Guardian Drive proves it works is covered in `docs/patents-and-ip-strategy.md`: trade secrets in the risk-scoring algorithm, the data moat from real deployments, speed to market, and — the hardest one to replicate — earned insurance/partnership trust.

[1]: https://www.amazon.com/CARLOCK-Anti-Theft-Car-Device/dp/B00U0K3Q10
[2]: https://www.compustar.com/dronemobile-smartphone-car-control
[3]: https://monimoto.com/
[4]: https://www.canadiantire.ca/en/pdp/kez-anti-theft-engine-immobilizer-by-keyfree-technologies-vehicle-specific-versions-for-multiple-makes-models-2340001p.html
[5]: https://starline-sales.eu/downloads/Manuals/StarLine_S9v2_manual_eng.pdf
[6]: https://www.getkez.com/
[7]: https://monimoto.com/how-monimoto-smart-tracker-works/
[8]: https://www.dronemobile.com/
[9]: https://www.dronemobile.com/subscriptions
[10]: https://www.iglacanada.ca/
[11]: https://www.autowatch.co.uk/products/autowatch-ghost-2-immobiliser
[12]: https://www.tagtracking.ca/en/how-it-works
[13]: https://www.speedyglass.ca/en/accessories/tag-vehicle-tracking
