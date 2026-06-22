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
- Tow, jack, and tilt detection using IMU movement patterns. A single MPU-6050 in the rear/main unit, mounted firmly to the car body, senses whole-car motion (tilt / tow / jack / strong shock). The device saves the car's parked tilt angle as a baseline (accounting for hills or uneven surfaces) and flags a suspicious event only when the angle changes significantly from that baseline while the engine is off — not against flat ground.
- Unauthorized start detection when the owner is not nearby.
- Layered intrusion sensing (hardware decision 2026-06-21, see hardware/BOM.md "Intrusion Sensing"):
  - **Break-in attempt** — an automotive shock/vibration sensor near the driver door flags possible tampering (a single trigger on a GPIO, not a second door-mounted MPU — avoids unreliable long in-cabin I2C runs). On its own: short siren chirp + push, GPS/LTE readied.
  - **Confirmed door/hood open** — magnetic reed switches (magnet on the moving panel, switch on the fixed frame) confirm an *actual* door or hood opening. This is the escalation gate from "possible attempt" to "confirmed entry/tamper."
- Door, hood, and trunk open correlation to confirm suspicious access (door/hood via the reed switches above).
- OBD port activity detection when service mode is off and owner phone + key tag are both absent. A mechanic or authorized user would have service mode enabled; unexpected OBD queries without it are a strong theft or cloning signal.
- Crash vs. theft classification. An impact alone (parked car hit, minor collision) is not theft. The system correlates impact with follow-on events before escalating:

| Event | Alert category | Device state | Siren |
|---|---|---|---|
| Impact only | Damage alert — not theft | kSuspicious — info log + non-critical notification | No |
| Impact + glass break sound | Damage / high risk | kSuspicious — non-critical notification (requires microphone/glass-break detection — Nice to Have / post-V1.5, see Product Tiers; do not block MVP crash/theft logic on this row) | No |
| Impact + door open, owner absent | Possible forced entry | kTheftCandidate — critical alert, confirmation requested (Section 3) | Warning chirp (Section 7 door-open rule) |
| Impact + door open + start / move | Theft likely — escalate | kTheftMode — Layer 1 automatic (Section 3) | Yes — full siren |

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

Layer 1 — Automatic (no owner action required): Triggered immediately when high-confidence theft signals are detected.

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

Layer 2 — User-confirmed (owner taps "Not me — confirm theft"): Activates full Recovery mode if not already active (live GPS sharing, evidence lock, police pack, emergency contact notification, siren — see Section 11) and gives the owner deliberate control over inhibit actions. Engine cut is not a product feature — it is too risky and not the product's responsibility.

Terminology:

| Action | Meaning | Used when |
|---|---|---|
| Start inhibit | Car cannot start | Best and safest — car not yet started |
| Next-start inhibit | Car cannot restart after next stop | Car already moving when theft confirmed |
| Engine cut | Actively stops running engine | Not a Guardian Drive feature — too dangerous |

| Condition | Action |
|---|---|
| Car not yet started | Start inhibit — relay interrupts the start authorization signal, car cannot start |
| Car already moving | No inhibit — siren + GPS + lights only. Next-start inhibit arms silently. |
| Car stops after moving (GPS speed < 8 km/h) | Next-start inhibit fires — car cannot restart |

The speed gate (< 8 km/h) is enforced in firmware for next-start inhibit. The relay will not fire while the car is moving, even if the owner has confirmed theft.

Start-inhibit hardware (Guardian Pro only — see Product Editions): the relay interrupts **only the start authorization signal**, never the main battery, ECU power, fuel pump, ABS, steering, or any safety circuit. On supported vehicles it is installed via a **vehicle-specific plug-in harness** that sits between a factory connector and its module (`factory connector → Guardian harness → factory module`) — **no factory wire cutting**, fully reversible, with an emergency bypass connector that restores the original connection if the device fails. Relay is normally-closed and fail-safe: device power loss → circuit restored, so a firmware bug can never strand the owner. The whole feature is about preventing **restart after confirmed theft while parked**, not stopping a moving vehicle.

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

Manual trigger/silence controls (owner override) are defined in Section 7.

False-alarm stop behavior:

- If the owner taps "It's me — Not a theft" and completes biometric confirmation (Section 6), siren stops immediately.
- Siren stop is logged with timestamp and actor for audit/evidence quality.

Two paths into Theft Mode:

| Path | Trigger | What's already active when the alert screen appears |
|---|---|---|
| Automatic (high-confidence) | No phone + no key tag + unlock/start/move (Section 12 truth table) — "trigger immediately, no confirmation delay" | Full Layer 1 bundle already active: siren, hazards, horn, live GPS, evidence lock, critical alert |
| Confirmation requested (Theft Candidate) | Weaker/correlated signals not yet at high confidence (e.g., "Possible forced entry" — Section 1) | Critical alert only. Siren, live GPS sharing, evidence lock, and inhibit are NOT yet active |

Alert screen — concrete behavior and timeline:

The critical alert screen (full-screen takeover) always shows the risk explanation plus exactly three controls. No control is optional and no control may be hidden. Behavior depends on which path (above) triggered the alert:

| Control | Type | If Theft Mode already active (Automatic path) | If Theft Candidate (Confirmation path) |
|---|---|---|---|
| "It's me — Not a theft" | Secondary button, requires biometric confirmation (Section 6's two-step flow) — prevents someone holding the owner's unlocked phone from silencing a real theft with one tap | Stand down: siren and live GPS sharing stop, device returns to Normal. Logs already sealed remain sealed but are flagged "dismissed by owner". Logged with timestamp + actor. | Dismiss: alert closes, no further action. Logged with timestamp + actor. |
| "Confirm Theft" | Primary button | Acknowledge: police pack becomes shareable, next-start inhibit armed (fires only once GPS speed < 8 km/h, per the speed-gate rule above). Siren/GPS/evidence lock were already active. | Escalate to Theft Mode: activates the full Layer 1 bundle — siren, hazards, horn, live GPS sharing (regardless of privacy mode, per Section 11, reverts after recovery), evidence lock, police pack, emergency contact notification — plus next-start inhibit armed. |
| "Share Live Location" | Tertiary button | Hidden — live location is already being shared. | Session-only live location share. Does not enter Theft Mode, apply the evidence lock, or arm next-start inhibit. For "I'm not sure, but let me see where the car is." |

No-response timeline (owner does not tap anything):

| Time | Behavior |
|---|---|
| T+0s | Alert fires. If Theft Mode is already active (Automatic path), the full Layer 1 bundle continues regardless of response. If Theft Candidate, only the critical alert and local evidence logging are active. |
| T+60s | Emergency contacts notified, per the Layer 1 table above. Alert remains active and dismissible. For a Theft Candidate, this does NOT itself escalate to Theft Mode — only "Confirm Theft" does. |
| Any time after | Owner can still tap "It's me" or "Confirm Theft" from the Alerts tab. No silent timeout ever escalates a Theft Candidate into Theft Mode or activates live GPS sharing for one — only an explicit "Confirm Theft" tap does. This preserves the Private/Balanced privacy guarantees in Section 11 even if the owner is asleep or unreachable. |

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

### 5. Evidence and Reporting

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

### 6. User Experience

- Mobile app dashboard showing status, battery, last location, and alerts.
- Risk scoring so the owner sees why an alert was triggered.
- Two-step confirmation flow: "It's me" and biometric confirmation.
- Household access profiles for multiple authorized drivers.
- Service mode, valet mode, and tow approval mode to suppress false alerts during authorized use (see Feature 9).
- Geofenced sensitivity for home and work.
- Emergency critical alert on phone when high-risk theft is detected:

Full-screen takeover alert

Loud alarm sound (full-volume override, bypasses silent and DND)

Strong vibration pattern

Push notification with theft details

Optional SMS / call backup if push is not acknowledged within 60 seconds

Emergency contact notification if owner does not respond

Example: "CRITICAL: Possible vehicle theft. Vehicle started without authorized user. Siren active. Confirm now."

Buttons: "It's me — Not a theft" / "Confirm Theft" / "Share Live Location" (full behavior defined in Section 3)

### 7. External Anti-Theft Siren

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

### 8. Vehicle Health, Reliability and Installation

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

### 9. Authorized Use Modes

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

Movement Without GPS (underground, ferry, auto train)GPS loss alone never triggers theft. Risk is only raised when GPS loss combines with other suspicious signals. Severity follows the general signal-loss escalation rule in Section 10.

| Situation | Action |
|---|---|
| GPS lost, owner / key tag present | Info log only (Section 10: signal loss alone) |
| GPS lost, valet / service / tow mode active | Info log only (authorized mode suppresses escalation) |
| GPS lost, car moving, owner / key absent | Low-priority alert (Section 10: signal loss + motion) |
| GPS lost after unauthorized start | Theft mode triggered (high-confidence trigger per Section 12, independent of GPS) |
| GPS lost after battery cut | Theft mode triggered (Section 10: signal loss + power cut) |

### 10. Signal Loss and Connectivity Edge Cases

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

### 11. Privacy and GPS Sharing Control

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

### 12. Guardian Key Tag

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

### 13. Automatic Power Management (No Manual Battery Tasks)

Battery saving is automatic in firmware. The user should not manage GPS/LTE sleep settings manually in normal operation.

Automatic modes:

| Mode | When | Behavior |
|---|---|---|
| Driving Mode | Ignition on | Device charges from vehicle power, normal sensing active |
| Parked Protected Mode | Ignition off, no risk | ESP32 low power, MPU motion watch active, LTE/GNSS mostly off |
| Suspicious Mode | Movement/tow/tamper hints (kSuspicious) | ESP32 fully awake, risk re-check, LTE/GNSS wake as needed |
| Theft Candidate Mode | Critical alert sent, awaiting owner confirmation (kTheftCandidate, Section 3) | ESP32 fully awake, LTE/GNSS active for alert delivery and GPS-lock readiness; siren and evidence lock NOT yet active |
| Theft Mode | High confidence theft or owner-confirmed (kTheftMode) | LTE/GNSS/siren active, evidence lock + live alerts |

Charging policy:

- No daily user charging workflow.
- Device auto-charges from vehicle power through a power-path charger.
- USB charging, if present, is service/debug fallback only.

User-facing UX principle:

- App shows status and battery health, but not manual battery-saving toggles as a daily task.

## Product Strategy

All features will be built. Access is gated by subscription tier so revenue scales with usage while the full product ships end-to-end.

## Product Editions (hardware install level) — DECISION 2026-06-21

Two physical editions, distinct from the feature-rollout tiers (MVP/V1.5/V2) below. Editions are
about *how much of the car is touched at install*; tiers are about *when features ship*.

**Guardian Basic — no car wiring touched.** Self-contained, owner-installable.
- GPS/LTE tracking, tilt/movement detection, key tag + phone presence, OBD tamper detection,
  siren, jamming detection, app theft mode, event logging.
- Detects, alerts, and tracks — but does not prevent restart.

**Guardian Pro — professional install.** Everything in Basic, plus:
- Vehicle-specific **plug-in harness** + relay-based **start inhibitor** (interrupts only the
  start authorization signal; **no factory wire cutting**; reversible; emergency bypass connector).
- Hidden installation, optional OBD relocation, optional hardwired power.

> **Guardian Basic detects, alerts, and tracks. Guardian Pro adds preventing restart after
> confirmed theft** (parked-only, per Section 3's start/next-start inhibit rules and the
> Stop & Recovery Tier design in master-procurement-checklist.md).

Why the plug-in harness for Pro instead of cutting a starter/ignition wire: it targets only the
start authorization path (not main power/ECU/fuel/ABS/steering), keeps the install reversible and
professional ("no factory wire cutting on supported vehicles"), avoids warranty/warning-light/
resale concerns, and includes an emergency bypass so a device failure can't strand the owner.

**Open questions for Guardian Pro harness design — RESOLVED 2026-06-22 (lean answers for current prototype stage):**
- **Vehicle coverage / SKU scaling.** Resolution: don't try to cover all vehicles. Pick 2-3
  high-volume vehicles first and license an existing aftermarket wiring database (e.g.,
  iDatalink, Bulldog Security) instead of reverse-engineering wiring from scratch. Maintain an
  explicit, growing **"Guardian Pro supported vehicles" whitelist** — Basic ships to every
  vehicle regardless of make/model; Pro ships only where a verified harness exists. This also
  reinforces the existing CAN/OBD-stays-read-only decision (Stop & Recovery scope) — the harness
  never needs CAN access to inhibit start, so that boundary stays intact as coverage grows.
- **Emergency bypass connector security.** Resolution: don't rely on physical hiding alone
  (security-by-obscurity is weak). The relay's fail-safe behavior (device power loss → circuit
  restored) stays purely physical, no auth needed — that's correct as-is. But *actively* using
  the bypass while the device is powered should require the owner/installer to first enable
  **Service Mode** from the app (Section 9 — time-windowed, logged with timestamp + actor).
  Reuses an existing product pattern instead of inventing a new security primitive; a thief
  finding the connector under the dash still can't silently defeat the inhibitor without an
  authenticated app action.
- **Per-vehicle identification process at install.** Resolution: no scanning tooling yet — too
  much engineering for this stage. Write a one-time **install guide per supported vehicle**
  (factory connector photo + pinout + which wire is the start-authorization signal), authored
  once when that vehicle is validated, then handed to installers for that model. This is the
  lean version of the aftermarket wiring databases above, built one vehicle at a time starting
  with whichever vehicle the harness is first prototyped on.

## Product Tiers (feature rollout)

### MVP — Ship First

The core product. Strong enough to sell, defend, and generate early subscribers. This MVP
feature set is the **Guardian Basic** capability (detect / alert / track, no car wiring); the
relay-based **start inhibitor** ships with **Guardian Pro** (see Product Editions above) and
follows the parked-only start/next-start rules in Section 3.

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
- Valet mode, service mode, and tow approval mode (full authorized use modes — Feature 9)
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
