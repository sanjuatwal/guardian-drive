# Backend

Cloud API, risk engine, evidence vault, and live alert push for Guardian Drive.

Node 20 + TypeScript + Express + SQLite (zero external services — everything runs locally).

## Run It

```bash
cd backend
nvm use 20
npm install
npm run seed     # creates demo device "demo-device"
npm run dev      # http://localhost:4000
```

## Architecture

```
backend/src/
├── index.ts          ← Express + WebSocket server bootstrap
├── config.ts         ← port, DB path, risk thresholds
├── db.ts             ← SQLite schema (devices, events, alerts)
├── types.ts          ← domain types (mirrors app/src/types/app.ts)
├── riskEngine.ts     ← rule-based scoring: base score + key-tag/night/cluster bonuses
├── evidenceVault.ts  ← SHA-256 hash chain locking on theft confirmation
├── policePack.ts     ← incident PDF generation + email delivery (Resend)
├── presenter.ts      ← shapes DB rows into the app's state format
├── live.ts           ← WebSocket hub (ws://host:4000/live?deviceId=<id>)
├── seed.ts           ← demo device seeder
└── routes/
    ├── devices.ts    ← registration, state, event ingestion, settings
    └── alerts.ts     ← confirm / dismiss / evidence export
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness check |
| POST | `/api/v1/devices` | register a device `{name}` |
| GET | `/api/v1/devices/:id/state` | full app state (matches `MockAppState` shape) |
| GET | `/api/v1/devices/:id/events` | recent activity feed |
| POST | `/api/v1/devices/:id/events` | **firmware ingestion** — sensor event + vitals |
| PATCH | `/api/v1/devices/:id/settings` | privacy mode, service mode |
| POST | `/api/v1/alerts/:id/confirm` | owner confirms theft → recovery mode + evidence lock |
| POST | `/api/v1/alerts/:id/recovered` | owner marks vehicle recovered → back to protected, closes the recovery (evidence stays locked) |
| POST | `/api/v1/alerts/:id/dismiss` | false alarm → back to protected |
| GET | `/api/v1/alerts/:id/evidence` | tamper-evident timeline with hash verification |
| POST | `/api/v1/alerts/:id/police-pack` | `{recipientName, recipientEmail}` — emails the incident PDF directly; app never sees the file |
| WS | `/live?deviceId=<id>` | live push of events/alerts/settings changes |

### Event ingestion example (what the ESP32 will send over LTE)

```bash
curl -X POST localhost:4000/api/v1/devices/demo-device/events \
  -H 'content-type: application/json' \
  -d '{"type":"tilt","detail":"Front lifted 9 degrees","keyTagPresent":false}'
```

Event types: `heartbeat`, `door_open`, `motion`, `tilt`, `impact`, `glass_break`,
`power_cut`, `unauthorized_start`, `obd_tamper`, `gps_jamming`, `key_tag_lost`, `key_tag_found`.
Optional vitals on any event: `batteryPct`, `keyTagPresent`, `gpsOk`, `lteOk`, `lat`, `lng`, `locationLabel`.

Set `DEVICE_API_KEY` env var to require an `x-device-key` header on ingestion.

## Risk Engine

Each event gets a base score (door_open 15 … unauthorized_start 65), then context bonuses:
+20 if the key tag is absent, +15 during 22:00–06:00, +10 per distinct suspicious event
type in the same 10-minute cluster. Score ≥ 70 opens an alert and flips the device to
`alert` status. Service mode suppresses all alerting.

## Evidence Vault

On theft confirmation, every event in the alert's cluster is hash-chained
(`h₀ = sha256(alertId)`, `hᵢ₊₁ = sha256(hᵢ ‖ canonical(event))`) and the rows are locked.
`GET /evidence` re-computes the chain and reports `chainValid` so any tampering with the
timeline is detectable.

## Police Pack

`POST /api/v1/alerts/:id/police-pack` with `{ recipientName, recipientEmail }` only works once
an alert is `confirmed` (evidence is locked at that point). It builds a PDF of the full event
timeline plus hash-chain verification, and emails it via Resend straight to the given address —
the PDF is never returned in the API response, so the app itself has no way to view or download
it, only to trigger the send. Requires `RESEND_API_KEY` in `.env` (see `.env.example`); without
it the endpoint returns a 502.

## Not Built Yet

- Push notifications to the phone (siren bypass) — app currently needs to poll or hold a WS connection
- Time-limited share links for evidence
- Geofencing (home/work zones)
- Real auth (per-device keys exist as a single shared secret only)
