# Guardian Drive — Final Feature Document

## Product Goal

Build an all-round vehicle anti-theft system for GTA drivers that does more than recover stolen cars. The product should detect theft attempts early, reduce false alarms, preserve evidence, and keep working even when a thief tries to disable it.

## Core Product Promise

Detect suspicious activity before the vehicle is gone, alert the owner immediately, and keep tracking if theft succeeds.

## Product Principles

- Fast detection: Alert within seconds of suspicious activity.
- Low false alarms: Use multiple signals before escalating.
- Tamper resistant: Continue operating if power is cut or components are attacked.
- Useful evidence: Save a clean timeline for police and insurance.
- Daily usable: Support normal driving, valet, service, and shared household use.
- No manual battery chores: Power saving and charging are automatic in firmware and hardware.

## Final Feature Set

### 1. Theft Detection

- Relay attack detection using key presence + vehicle unlock/start mismatch.
- Tow, jack, and tilt detection using IMU movement patterns. The device saves the car's parked tilt angle as a baseline (accounting for hills or uneven surfaces) and flags a suspicious event only when the angle changes significantly from that baseline while the engine is off — not against flat ground.
- Unauthorized start detection when the owner is not nearby.
- Door, hood, and trunk open correlation to confirm suspicious access.
- OBD port activity detection when service mode is off and owner phone + key tag are both absent. A mechanic or authorized user would have service mode enabled; unexpected OBD queries without it are a strong theft or cloning signal.
- Crash vs. theft classification. An impact alone (parked car hit, minor collision) is not theft. The system correlates impact with follow-on events before escalating:

| Event | Alert category |
|---|---|
| Impact only | Damage alert — not theft |
| Impact + glass break sound | Damage / high risk |
| Impact + door open, owner absent | Possible forced entry |
| Impact + door open + start / move | Theft likely — escalate |

If impact occurs but no door open, start, or movement follows within a short window: send a damage alert only, not a theft alert.

### 2. Anti-Tamper Protection

- Power-cut detection when vehicle battery is disconnected. On main power loss: log exact timestamp, send immediate alert ("Vehicle power disconnected. Guardian Drive is running on backup battery."), switch to low-power theft mode, continue GPS/LTE tracking, and save evidence locally if network is blocked. Many cheap trackers fail at this point; this is a key product differentiator.
- OBD tamper detection if the port is unplugged or queried unusually (see also: OBD activity detection in Feature 1 — service mode gating is the key distinguisher between authorized mechanic access and a theft/cloning attempt).
- Antenna tamper detection for GPS/LTE signal loss or shielding.
- Device relocation detection if the hidden unit is moved after installation. On install, the device learns its normal orientation and in-vehicle location. Any movement while the car is off or after a suspicious event triggers a tamper alert: "Guardian Drive device movement detected. Possible tampering." Moving the device during installer mode or service mode is permitted and does not alert.
- Firmware integrity checks to prevent cloning or malicious reflashing.
- Jamming detection for GPS/LTE/GNSS interference. Triggered when GPS and LTE degrade abnormally together during suspicious vehicle activity (movement, unauthorized start, or power tamper). Response: save local sensor logs, store last known location, switch to silent evidence mode, attempt periodic reconnect, and alert owner once network returns: "Signal interference suspected. Last known location saved. Evidence mode active."

### 3. Theft Response — Two Layers

The system does not wait for the owner to confirm theft before acting. A thief may be gone in seconds. Protection is split into two independent layers.

Layer 1 — Automatic (no owner action required):Triggered immediately when high-confidence theft signals are detected.

| Action | Trigger |
|---|---|
| Siren activates | Unauthorized start or movement, owner / key absent |
| Critical app alert activates at the same time as siren | Any siren-triggering high-risk event |
| Hazard lights flash | Theft mode active |
| Horn chirps intermittently | Theft mode active and moving |
| Live GPS tracking begins | Theft mode active |
| Evidence lock applied | Theft mode active |
| Emergency alert sent to phone | Theft mode active |
| Emergency contacts notified | Owner does not respond within 60 seconds |

These happen in the background, immediately, without waiting for any button tap.

Layer 2 — User-confirmed (owner taps "Not me — confirm theft"):Gives the owner deliberate control over inhibit actions. Engine cut is not a product feature — it is too risky and not the product's responsibility.

Terminology:

| Action | Meaning | Used when |
|---|---|---|
| Start inhibit | Car cannot start | Best and safest — car not yet started |
| Next-start inhibit | Car cannot restart after next stop | Car already moving when theft confirmed |
| Engine cut | Actively stops running engine | Not a Guardian Drive feature — too dangerous |

| Condition | Action |
|---|---|
| Car not yet started | Start inhibit — relay cuts starter circuit, car cannot start |
| Car already moving | No inhibit — siren + GPS + lights only. Next-start inhibit arms silently. |
| Car stops after moving (GPS speed < 8 km/h) | Next-start inhibit fires — car cannot restart |

The speed gate (< 8 km/h) is enforced in firmware for next-start inhibit. The relay will not fire while the car is moving, even if the owner has confirmed theft.

Full automatic vs. confirmed action reference:

| Feature | Automatic? | Needs user confirmation? |
|---|---|---|
| Emergency app alert | Yes | No |
| Loud siren | Yes, on high risk | No |
| Evidence timeline | Yes | No |
| Backup battery mode | Yes | No |
| GPS local logging | Yes | No |
| Live GPS sharing | Depends on privacy mode | User choice or confirmed theft |
| Police pack | Prepared automatically | Shared after user confirms |
| Start inhibit (before engine starts) | Yes in high-security mode | Optional per user setting |
| Next-start inhibit (after confirmed theft, car stops) | Yes, once speed < 8 km/h | Confirmation required once |
| Engine cut while moving | Not a product feature | Too dangerous — removed |

Siren policy and owner override:

| Setting | Behavior |
|---|---|
| Aggressive deterrence (default) | On high-risk theft confidence, siren + critical notification start immediately and together |
| Balanced deterrence (optional) | Uses a slightly stricter threshold before siren, but still sends critical notification immediately |

False-alarm stop behavior:

- If the owner taps "It's me" or "No theft" in the app, siren stops immediately.
- Siren stop is logged with timestamp and actor for audit/evidence quality.

### 4. Recovery Mode

- Theft mode activation after repeated suspicious events or owner confirmation.
- Live GPS tracking with adaptive ping rates based on threat level and battery state:

| Situation | Ping rate |
|---|---|
| Car parked normally | Every few hours or on event |
| Suspicious activity | Every 30–60 seconds |
| Confirmed theft and moving | Every 10 seconds |
| Battery low | Every 1–2 minutes |
| Signal blocked | Store logs locally, upload on reconnect |

- Backup battery operation for at least 48–72 hours in theft mode.
- Silent evidence mode that stores buffered logs if network signals are blocked.
- Cross-border and port hotspot alerts for known theft/export routes.

### 4. Evidence and Reporting

- Theft timeline with unlock, start, move, and route history.
- One-tap police pack. Owner taps "Generate Police Report PDF" and the app produces a complete incident package — designed for a panicked owner who cannot explain everything manually:

| Evidence | Example |
|---|---|
| Vehicle details | Make, model, plate, VIN |
| Device ID | Guardian Drive unit number |
| Timeline | 2:03 AM unlocked → 2:04 AM started → 2:06 AM moved |
| Last known location | Map link |
| Route | Full movement trail |
| Tamper events | Power cut, GPS loss, OBD access |
| Confidence score | 92% likely theft |
| Owner confirmation | "Not me" button press logged |

- Remote evidence lock: cryptographic hashes applied to sensor logs the moment theft is confirmed, creating a tamper-proof evidentiary chain. High-fidelity logs accelerate insurance adjuster reviews and open direct B2B partnership paths with insurance providers.
- Secure police/insurance share link with time-limited access.
- Insurance export mode for claim submission.

### 5. User Experience

- Mobile app dashboard showing status, battery, last location, and alerts.
- Risk scoring so the owner sees why an alert was triggered.
- Two-step confirmation flow: "It's me" and biometric confirmation.
- Household access profiles for multiple authorized drivers.
- Service mode, valet mode, and tow approval mode to suppress false alerts during authorized use (see Feature 8).
- Geofenced sensitivity for home and work.
- Emergency critical alert on phone when high-risk theft is detected:

Full-screen takeover alert

Loud alarm sound (full-volume override, bypasses silent and DND)

Strong vibration pattern

Push notification with theft details

Optional SMS / call backup if push is not acknowledged within 60 seconds

Emergency contact notification if owner does not respond

Example: "CRITICAL: Possible vehicle theft. Vehicle started without authorized user. Siren active. Confirm now."

Buttons: "It's me — silence alert" / "Not me — confirm theft" / "Share live location"

### 6. External Anti-Theft Siren

A hidden, weather-resistant siren unit mounted in a hard-to-reach location (underbody, behind bumper/fender, or engine bay). Goal: make the stolen car obvious, stressful, and risky to drive. A thief hearing a recognizable Guardian Drive theft sound is more likely to abandon the vehicle.

Recommended placement:

| Location | Benefit | Concern |
|---|---|---|
| Underbody hidden mount | Hard to access quickly | Needs weatherproofing |
| Behind bumper / fender | Hidden and loud outside | Installer required |
| Engine bay hidden area | Easier wiring | Thief may access hood |
| Inside cabin | Loud for thief | Easier to muffle |

Best option: underbody or behind bumper — furthest from reach, loudest externally.

Siren activation rules (immediate response design):

| Condition | Siren |
|---|---|
| Door opened, owner / key nearby | No |
| Door opened, owner / key not nearby | Warning chirp only |
| Unauthorized start + owner / key absent | Yes |
| Car moving + owner / key absent | Yes |
| Power cut + door / start event | Yes |
| OBD tamper + owner / key absent | Yes |
| Owner confirms "Not me" | Yes — immediately |
| Theft mode active | Yes |

Notification coupling rule: when siren starts, the critical app notification is sent at the same time (not later).

Remote control: Owner can manually trigger or silence the siren from the app at any time.

User-configurable siren profile: app exposes Aggressive (default) and Balanced siren sensitivity. This is preference tuning, not manual protection mode management.

Hardware note: Siren wired to ESP32 GPIO via relay (ESP32 outputs 3.3V; relay drives the 12V car siren). Requires weatherproof enclosure for underbody placement.

### 7. Vehicle Health, Reliability and Installation

- Ongoing health checks (weekly self-test):

Battery health, backup battery charge level

Antenna health (GPS, LTE signal quality)

Microphone status

Siren test (audible confirmation)

Install quality: vibration, GPS signal strength, antenna placement score

- Degraded-protection alert if any check fails: "GPS signal weak — location accuracy reduced."
- OTA updates for detection improvements and bug fixes.

Installer Validation ModeRun once at installation. The app walks the installer (or owner) through a mandatory checklist before the device is considered active. A device that fails any check should not be considered fully protected.

| Check | Purpose |
|---|---|
| GPS signal quality | Good location accuracy from install location |
| LTE signal strength | Reliable alerts from install location |
| Backup battery test | Confirm it works after simulated power cut |
| Siren test | Confirm it is loud enough and audible outside vehicle |
| Device orientation calibration | Baseline for tamper / relocation detection |
| Guardian Key Tag pairing | Authorization chain confirmed |
| Ignition detection test | Start / stop events correctly detected |
| Door sensor test | Entry events correctly detected |

Installer mode must be closed by the owner (not the installer) before the device goes live. This prevents an installer from leaving the device in a vulnerable uncalibrated state.

Weather and physical durability (Canadian climate):The GTA environment is harsh: road salt, freeze-thaw cycles, humidity, heat. Hardware requirements for any externally mounted component (siren, antenna, enclosure):

Weatherproof enclosure (IP65 minimum for underbody / bumper siren)

Salt-resistant casing and mounting hardware

Vibration-resistant mounting (potholes, rough roads)

Temperature-rated battery (functional from -30°C to +60°C)

Water ingress detection: alert if moisture is sensed inside device enclosure

Weekly siren / device health test includes physical condition check

### 8. Authorized Use Modes

Several real-world situations look identical to theft from the sensor's perspective. These modes suppress false alerts while keeping the protection rules intact. Authorization uses the Guardian Key Tag as backup where the owner's phone is unavailable.

Service ModeOwner enables before dropping the car at a mechanic. Suppresses alerts triggered by: hood open, OBD access, battery disconnect, and car movement without owner nearby.

Set for a fixed time window (e.g., 4 hours)

Optionally scoped to a named location (e.g., "ABC Auto Shop")

OBD access is logged but not alerted

If car leaves the set location during service mode: low-priority alert to owner

Automatically expires; cannot be extended remotely without owner biometric confirmation

Valet ModeOwner enables when handing the key to a valet. The key fob is with the valet — their responsibility. Guardian Drive monitors for out-of-bounds behavior only.

| Condition | Allowed? |
|---|---|
| Low-speed movement nearby | Yes |
| Driving within geofence | Yes |
| OBD access | No — alert |
| Battery disconnect | No — alert |
| Leaving geofence | Alert to owner |
| Speed above set limit | Alert to owner |
| Long trip distance | Alert to owner |

Valet mode is simpler than adding a household profile — no account needed, activated with one tap and a time limit.

Tow Approval ModeCar breaks down, owner calls a legitimate tow (CAA, roadside assistance). Tilt + movement + engine off + owner absent would normally trigger theft mode. Owner taps "I authorized towing" before or immediately after the tow begins.

Siren and emergency alert are suppressed

GPS tracking continues passively (owner can watch the tow route)

Evidence is still logged in case the tow goes to an unexpected location

If towing begins without approval: siren + emergency alert + evidence mode as normal

Movement Without GPS (underground, ferry, auto train)GPS loss alone never triggers theft. Risk is only raised when GPS loss combines with other suspicious signals.

| Situation | Action |
|---|---|
| GPS lost, owner / key tag present | Normal — info log only |
| GPS lost, valet / service / tow mode active | Normal — info log only |
| GPS lost, car moving, owner / key absent | Medium risk — alert |
| GPS lost after unauthorized start | Critical — theft mode |
| GPS lost after battery cut | Critical — theft mode |

### 9. Signal Loss and Connectivity Edge Cases

The system must distinguish between normal signal loss (underground parking, rural areas) and genuine jamming or tampering. False alerts in these situations erode user trust.

Case 1: Car enters underground parking

| Signal | Meaning |
|---|---|
| GPS drops | Normal |
| LTE weak / drops | Normal in underground area |
| Car moving slowly | Normal |
| Owner phone / key tag present | Authorized |
| No power cut, no OBD tamper | Not suspicious |

Action: No theft alert. Log as info: "GPS temporarily unavailable. Last known location saved."

Case 2: Car enters rural / no-network area

| Signal | Meaning |
|---|---|
| LTE drops | Normal in low-coverage area |
| GPS still works | Not suspicious |
| Owner / key tag present | Authorized |
| Car movement is normal | Not suspicious |

Action: No theft alert. Device stores events locally and uploads on reconnect. Message later: "Trip data synced after temporary network loss."

Case 3: GPS and LTE drop together while car is parked

| Signal | Meaning |
|---|---|
| GPS drops | Possible garage or shielding |
| LTE drops | Possible poor network |
| Car is not moving | Lower risk |
| No door / start / motion event | Lower risk |

Action: No siren. Low-priority notification: "Guardian Drive connection temporarily unavailable. Last known location saved." Only escalate to a theft alert if a tamper event, power cut, or motion was also detected.

Escalation rule across all three cases:

Signal loss alone         → Info log only
Signal loss + motion      → Low-priority alert
Signal loss + tamper/OBD  → High-priority alert
Signal loss + power cut   → Theft mode triggered

### 10. Privacy and GPS Sharing Control

Guardian Drive does not require always-on location sharing for normal use. This is a product differentiator: "Your car is protected without turning your life into a tracking log."

Privacy modes:

| Mode | How it works |
|---|---|
| Private | Location stored on-device only; shared only after owner confirms theft |
| Balanced | Last known location and theft events stored securely server-side; full route not shared |
| Recovery | Live GPS shared during confirmed theft only |
| Always-on | User opts into full continuous tracking |

Default is Balanced. The app shows: "Vehicle protected. Location private." during normal driving.

What is stored locally during normal use:

Last known location

Motion and tilt data

Unlock / start / tamper events

Signal history

Full route data is not uploaded unless the user permits it.

What activates live GPS sharing:

When the owner taps "Not me — confirm theft", the device immediately switches to Recovery mode and activates:

Live GPS sharing with backend

Police / insurance evidence pack generation

Emergency contact notification

Siren mode

Cryptographic evidence lock (logs sealed from this moment forward)

Once the vehicle is recovered, the owner can revert to their chosen privacy mode.

### 11. Guardian Key Tag

A small Bluetooth / NFC / UWB tag that attaches to the physical car key. Used to distinguish authorized key-only trips from genuine theft attempts, and to help owners locate lost keys.

Signal logic:

| Signal | Meaning |
|---|---|
| Phone not nearby | Suspicious alone |
| Guardian Key Tag nearby | Authorized physical key present |
| Manual unlock / start detected | Expected |
| Driving begins | Normal — key tag is present |

Product rule: If the phone is absent but an authorized key tag is present, do not trigger theft mode. Log the event as an "authorized key-only trip."

Theft rule: If neither the owner's phone nor any authorized key tag is detected near the vehicle, and an unlock, start, or movement event occurs — this is confirmed theft. Trigger theft mode immediately, no confirmation delay.

| Phone nearby | Key tag nearby | Car unlock / start / move | Verdict |
|---|---|---|---|
| Yes | — | Any | Authorized |
| No | Yes | Any | Authorized key-only trip |
| No | No | None | Suspicious — monitor |
| No | No | Yes | THEFT — trigger immediately |

App behavior:

No critical theft alert is sent.

An informational (non-emergency) notification is sent to all household members: "Vehicle was driven using authorized key tag while phone was away."

Once the phone regains internet, the app shows the trip in the timeline as authorized.

Key tag features:

Attaches to any physical key ring.

Low-energy Bluetooth / UWB ranging for proximity detection.

Replaceable battery with low-battery alert in app: "Guardian Key Tag battery low. Replace soon." Alert fires at ~20% and again at ~5%.

Find My Key: tap "Locate Key Tag" in app to trigger a beep on the tag.

Phone-dead fallback:If the owner's phone battery dies, the car must still be usable without triggering theft mode. The following are accepted as authorization when the phone is unavailable:

| Fallback method | How it works |
|---|---|
| Guardian Key Tag present | Treated as authorized — key-only trip logged |
| Backup PIN | Owner enters PIN via app before phone dies, or via in-app pre-auth |
| Trusted secondary driver | Household profile with their own phone / key tag |

App note: "Phone unavailable mode: authorized key tag or backup PIN can authorize use."

Key tag battery dies fallback:If the key tag battery is dead, the owner still has options:

| Fallback method | How it works |
|---|---|
| Phone app approval | Owner opens app and approves the trip manually |
| Backup PIN | Pre-set PIN entered to authorize one-time start |
| Temporary unlock code | Generated in app, single-use, time-limited |
| Grace mode | One-time start allowed after biometric confirmation in app |

The system will not lock out an owner who genuinely lost a key tag battery. Grace mode exists specifically for this — but it requires biometric confirmation to prevent a thief from exploiting it.

### 12. Automatic Power Management (No Manual Battery Tasks)

Battery saving is automatic in firmware. The user should not manage GPS/LTE sleep settings manually in normal operation.

Automatic modes:

| Mode | When | Behavior |
|---|---|---|
| Driving Mode | Ignition on | Device charges from vehicle power, normal sensing active |
| Parked Protected Mode | Ignition off, no risk | ESP32 low power, MPU motion watch active, LTE/GNSS mostly off |
| Suspicious Mode | Movement/tow/tamper hints | ESP32 fully awake, risk re-check, LTE/GNSS wake as needed |
| Theft Mode | High confidence theft | LTE/GNSS/siren active, evidence lock + live alerts |

Charging policy:

- No daily user charging workflow.
- Device auto-charges from vehicle power through a power-path charger.
- USB charging, if present, is service/debug fallback only.

User-facing UX principle:

- App shows status and battery health, but not manual battery-saving toggles as a daily task.

## Product Strategy

All features will be built. Access is gated by subscription tier so revenue scales with usage while the full product ships end-to-end.

## Product Tiers

### MVP — Ship First

The core product. Strong enough to sell, defend, and generate early subscribers.

- Unauthorized unlock / start detection
- Owner and authorized driver proximity check (phone + Guardian Key Tag)
- Tow / jack / tilt detection with parked baseline angle
- Battery disconnect alert with automatic backup battery switchover
- Theft mode with live GPS tracking (adaptive ping rate)
- External anti-theft siren (hidden underbody / bumper mount, relay-driven, remote trigger from app)
- Loud critical alert in app (full-screen takeover, full-volume override, bypasses silent / DND, SMS / call backup if unacknowledged)
- Basic risk score explanation ("Why am I seeing this alert?")
- Timeline and one-tap police report PDF
- Device health check + installer validation checklist (8-point, must pass before device goes live)
- Weather and physical durability requirements (IP65, salt/vibration/temperature rated)
- Crash vs. theft classification (damage alert vs. theft alert based on follow-on events)
- Phone-dead and key tag battery fallback authorization (backup PIN, grace mode, temporary unlock code)

### V1.5 — Reliability and Trust

Reduces false alarms and adds professional-use modes.

- OBD tamper detection and unauthorized OBD activity alerts
- Jamming and signal interference detection
- Valet mode, service mode, and tow approval mode (full authorized use modes — Feature 8)
- Household access profiles for multiple authorized drivers
- Door / hood / trunk open correlation
- Adaptive risk scoring improvements
- Secure cryptographic evidence lock

### V2 — Monetization and Scale

Advanced features that open B2B and partnership revenue.

- Insurance integrations and export mode for claims
- Cross-border and port hotspot intelligence
- Community recovery network
- Fleet, rental, and dealer admin console:

Add / remove authorized drivers per vehicle

Set geofences and speed limits per driver

View theft events and device health across all vehicles

Export police / insurance reports in bulk

Audit log: who confirmed theft, when, what actions were taken

Multi-vehicle dashboard

- Start inhibit and next-start inhibit partnerships at scale (fleet, insurance, law enforcement integrations)

### Nice to Have

High effort, uncertain reliability — revisit after V1.5 ships.

- Glass break detection via microphone (high false-positive risk; needs real-world audio dataset before it can be trusted)

## What Makes It All-Rounder

This product is not just a tracker. It covers the full lifecycle:

- Detect suspicious behavior early.
- Reduce false alarms with multiple signals.
- Survive power cuts and jamming.
- Keep recording evidence.
- Help recovery and reporting.
- Support normal ownership use cases.

## Final Recommendation

Build the company around early theft detection plus evidence-quality tracking. That is the real market gap: most products answer "Where is my stolen car?" while this product answers "Someone is trying to steal my car right now."

That positioning is strong, practical, and differentiates the product from standard trackers.
