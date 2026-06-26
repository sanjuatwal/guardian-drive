# Phone ↔ Car-Unit BLE Proximity

Real Bluetooth detection of "is the owner's phone near the vehicle" (feature-document.md
Section 12), replacing the old simulated `ProximityChecker_Stub` toggle.

## How it works

- The **car unit (ESP32-S3)** is the BLE *peripheral*: it advertises the Guardian service
  (`guardian-firmware/src/sensors/ProximityChecker_BLE.cpp`) and waits.
- This **app** is the BLE *central*: it scans for that service, connects when in range, and
  writes the shared owner token to prove it's the owner's phone
  (`src/ble/useProximity.ts`).
- A live, authenticated connection ⇒ `ownerPhoneNearby() == true` on the ESP32. The link
  dropping (phone out of range) ⇒ phone away, and the firmware's Section 12 theft logic kicks in.

**Why the car unit advertises and the phone scans (not the reverse):** iOS hides an app's
advertised service UUID once the app is backgrounded (phone in pocket), so a generic scanner
like the ESP32 can't see it. iOS handles background *scanning* well, so the phone scans.

Shared identity lives in two files that **must stay in sync**:
- App: `src/ble/guardianBle.ts`
- Firmware: `guardian-firmware/src/config.h` (and `config.example.h`)

## Why this needs a dev build (not Expo Go)

Expo Go is a generic prebuilt app and does not bundle native Bluetooth. We use a **custom dev
client** built locally over USB. Day-to-day JS editing still works the same (`npm start`,
live reload); you only rebuild when native deps change.

`npx expo run:*` automatically runs `expo prebuild`, generating the native `ios/` and
`android/` folders on demand — you don't run prebuild separately.

## Android (Android Studio + USB)

One-time:
1. Install Android Studio + Android SDK.
2. On the phone: enable Developer Options → USB debugging, connect via USB, accept the prompt.

Build + install:
```bash
cd app
npx expo run:android --device
```
Then for normal JS iteration: `npm start` and open the installed **Guardian Drive** app
(not Expo Go).

## iOS (Xcode + USB)

One-time:
1. Install Xcode (free, Mac App Store).
2. On the iPhone: Settings → Privacy & Security → Developer Mode → on (phone restarts).
3. Connect via USB, trust the Mac.
4. Free Apple ID signing: open `ios/` in Xcode once, set your Apple ID as the Signing Team for
   the target. (Free signing certs expire every 7 days — just re-run the build to refresh. A
   paid Apple Developer account removes the 7-day limit but isn't required.)

Build + install:
```bash
cd app
npx expo run:ios --device
```

## End-to-end test

1. Flash the firmware (`cd guardian-firmware && pio run -t upload`) and open the serial monitor.
   You should see: `BLE proximity: advertising "Guardian-Drive-01", waiting for owner phone...`
2. Launch the app on your phone, grant the Bluetooth prompt.
3. On the **Guardian Check** screen, the **Phone Link (BLE)** row should move
   `Searching… → Linking… → Phone near vehicle · <rssi> dBm`.
4. Serial monitor should print `BLE: central connected` then `BLE: owner phone authenticated — NEARBY.`
5. Now tilt the IMU past 8°: with the phone authenticated/nearby, the firmware takes the
   **authorized** path (no theft) instead of auto-triggering Theft Mode. Walk the phone away
   (~10 m) until serial prints `owner phone AWAY`, tilt again, and it should auto-trigger Theft Mode.

## Bench fallback (no app/phone handy)

The firmware keeps serial overrides so the theft logic is testable without a built app:
- `p` — force phone-present (override the real BLE link)
- `k` — toggle the simulated Guardian Key Tag (the real Key Tag is the separate ESP32-C3
  device, not built yet)

## Known limitations (dev stage)

- **iOS background:** reconnection while the app is fully backgrounded/killed needs
  CoreBluetooth state restoration tuning — not done yet. Foreground proximity works now.
- **No RSSI distance gate yet:** "connected" currently means "in BLE range" (can be ~10–30 m,
  not just "at the car"). A real proximity threshold on RSSI is a follow-up.
- **Owner token is a shared dev constant** in `guardianBle.ts` / `config.h`. Fine for bench;
  production needs a per-device provisioned secret.
