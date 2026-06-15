import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

import { config } from './config';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'protected',
    battery_pct     INTEGER NOT NULL DEFAULT 100,
    key_tag_present INTEGER NOT NULL DEFAULT 1,
    gps_ok          INTEGER NOT NULL DEFAULT 1,
    lte_ok          INTEGER NOT NULL DEFAULT 1,
    lat             REAL,
    lng             REAL,
    location_label  TEXT,
    privacy_mode    TEXT NOT NULL DEFAULT 'balanced',
    service_mode    INTEGER NOT NULL DEFAULT 0,
    last_seen_at    INTEGER
  );

  CREATE TABLE IF NOT EXISTS events (
    id           TEXT PRIMARY KEY,
    device_id    TEXT NOT NULL REFERENCES devices(id),
    type         TEXT NOT NULL,
    severity     TEXT NOT NULL,
    risk_score   INTEGER NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL DEFAULT '{}',
    alert_id     TEXT,
    locked       INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_events_device_time ON events(device_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS alerts (
    id            TEXT PRIMARY KEY,
    device_id     TEXT NOT NULL REFERENCES devices(id),
    status        TEXT NOT NULL DEFAULT 'active',
    risk_score    INTEGER NOT NULL,
    reasons_json  TEXT NOT NULL DEFAULT '[]',
    evidence_hash TEXT,
    created_at    INTEGER NOT NULL,
    resolved_at   INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS commands (
    id           TEXT PRIMARY KEY,
    device_id    TEXT NOT NULL REFERENCES devices(id),
    command      TEXT NOT NULL,
    created_at   INTEGER NOT NULL,
    delivered_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_commands_device ON commands(device_id, delivered_at);
`);
