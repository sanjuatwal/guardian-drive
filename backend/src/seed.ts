import { randomUUID } from 'node:crypto';

import { db } from './db';

// Seeds a stable demo device so the app and curl tests have something to hit.
const DEMO_ID = 'demo-device';

const existing = db.prepare(`SELECT id FROM devices WHERE id = ?`).get(DEMO_ID);
if (existing) {
  console.log(`demo device already exists: ${DEMO_ID}`);
} else {
  const now = Date.now();
  db.prepare(
    `INSERT INTO devices (id, name, status, battery_pct, key_tag_present, gps_ok, lte_ok,
                          lat, lng, location_label, privacy_mode, service_mode, last_seen_at)
     VALUES (?, ?, 'protected', 96, 1, 1, 1, 43.6532, -79.3832, 'Parked at Home', 'balanced', 0, ?)`,
  ).run(DEMO_ID, 'Guardian Unit — Civic', now);

  const insertEvent = db.prepare(
    `INSERT INTO events (id, device_id, type, severity, risk_score, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  insertEvent.run(
    randomUUID(), DEMO_ID, 'door_open', 'info', 15,
    JSON.stringify({ detail: 'Driver door opened with key tag nearby' }), now - 3 * 60 * 60 * 1000,
  );
  insertEvent.run(
    randomUUID(), DEMO_ID, 'motion', 'warning', 35,
    JSON.stringify({ detail: 'Brief movement, settled within 10 seconds' }), now - 40 * 60 * 1000,
  );

  console.log(`seeded demo device: ${DEMO_ID}`);
}
