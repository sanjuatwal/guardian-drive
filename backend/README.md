# Backend

Cloud API, risk engine, event database, and notification service for Guardian Drive.

## Planned Architecture

```
backend/
├── api/              ← REST/WebSocket API for device and app communication
├── risk_engine/      ← event scoring, theft detection logic
├── evidence_vault/   ← cryptographic hash locking for confirmed theft logs
├── notifications/    ← push alerts, emergency siren triggers
├── geofence/         ← home/work zone management
└── README.md         ← this file
```

## Key Responsibilities

- Receive sensor events from device over LTE
- Run risk scoring on each event cluster
- Fire push notifications to mobile app
- Lock evidence logs with SHA-256 hash on theft confirmation
- Generate police PDF and time-limited share links
- Store theft timeline for insurance export

More backend details will be added as the prototype moves to Stage 2 integration testing.
