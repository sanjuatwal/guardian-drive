import { randomUUID } from 'node:crypto';

import { config } from './config';
import { db } from './db';
import { broadcast } from './live';
import { assess } from './riskEngine';
import { AlertRow, DeviceRow, EventRow, EventSeverity, SensorEventType } from './types';

export const getDevice = db.prepare<[string], DeviceRow>(`SELECT * FROM devices WHERE id = ?`);
export const getRecentEvents = db.prepare<[string, number], EventRow>(
  `SELECT * FROM events WHERE device_id = ? AND type != 'heartbeat'
   ORDER BY created_at DESC LIMIT ?`,
);
export const getActiveAlert = db.prepare<[string], AlertRow>(
  `SELECT * FROM alerts WHERE device_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
);
export const getLatestConfirmedAlert = db.prepare<[string], AlertRow>(
  `SELECT * FROM alerts WHERE device_id = ? AND status = 'confirmed' ORDER BY created_at DESC LIMIT 1`,
);

export type EventVitals = {
  detail?: string | null;
  batteryPct?: number;
  keyTagPresent?: boolean;
  gpsOk?: boolean;
  lteOk?: boolean;
  lat?: number;
  lng?: number;
  locationLabel?: string;
};

export type IngestResult = {
  eventId: string;
  riskScore: number;
  severity: EventSeverity;
  alertId: string | null;
  alertCreated: boolean;
};

// Shared by the structured /api/v1 ingestion route and the firmware's legacy
// /api/events feed: applies vitals, risk-scores the event against the recent
// cluster, persists it, and opens an alert if the score crosses the threshold.
export function ingestEvent(device: DeviceRow, type: SensorEventType, vitals: EventVitals): IngestResult {
  const now = Date.now();

  db.prepare(
    `UPDATE devices SET
       battery_pct = COALESCE(?, battery_pct),
       key_tag_present = COALESCE(?, key_tag_present),
       gps_ok = COALESCE(?, gps_ok),
       lte_ok = COALESCE(?, lte_ok),
       lat = COALESCE(?, lat),
       lng = COALESCE(?, lng),
       location_label = COALESCE(?, location_label),
       last_seen_at = ?
     WHERE id = ?`,
  ).run(
    vitals.batteryPct ?? null,
    vitals.keyTagPresent === undefined ? null : Number(vitals.keyTagPresent),
    vitals.gpsOk === undefined ? null : Number(vitals.gpsOk),
    vitals.lteOk === undefined ? null : Number(vitals.lteOk),
    vitals.lat ?? null,
    vitals.lng ?? null,
    vitals.locationLabel ?? null,
    now,
    device.id,
  );

  if (type === 'key_tag_lost') {
    db.prepare(`UPDATE devices SET key_tag_present = 0 WHERE id = ?`).run(device.id);
  } else if (type === 'key_tag_found') {
    db.prepare(`UPDATE devices SET key_tag_present = 1 WHERE id = ?`).run(device.id);
  }

  const updatedDevice = getDevice.get(device.id)!;
  const recentEvents = getRecentEvents.all(device.id, 30);
  const assessment = assess(updatedDevice, type, now, recentEvents);

  const eventId = randomUUID();
  const payload = JSON.stringify({ detail: vitals.detail ?? null });

  let alert = getActiveAlert.get(device.id) ?? null;
  let alertCreated = false;

  const persist = db.transaction(() => {
    if (assessment.shouldAlert && !alert) {
      const alertId = randomUUID();
      db.prepare(
        `INSERT INTO alerts (id, device_id, status, risk_score, reasons_json, created_at)
         VALUES (?, ?, 'active', ?, ?, ?)`,
      ).run(alertId, device.id, assessment.score, JSON.stringify(assessment.reasons), now);
      db.prepare(`UPDATE devices SET status = 'alert' WHERE id = ?`).run(device.id);

      // Fold the triggering cluster into the alert so evidence locking
      // covers the whole window, not just this event.
      db.prepare(
        `UPDATE events SET alert_id = ? WHERE device_id = ? AND created_at >= ? AND alert_id IS NULL`,
      ).run(alertId, device.id, now - config.clusterWindowMs);

      alert = db.prepare<[string], AlertRow>(`SELECT * FROM alerts WHERE id = ?`).get(alertId)!;
      alertCreated = true;
    }

    db.prepare(
      `INSERT INTO events (id, device_id, type, severity, risk_score, payload_json, alert_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      eventId,
      device.id,
      type,
      assessment.severity,
      assessment.score,
      payload,
      alert && alert.status === 'active' ? alert.id : null,
      now,
    );
  });
  persist();

  broadcast(device.id, {
    type: alertCreated ? 'alert' : 'event',
    eventType: type,
    severity: assessment.severity,
    riskScore: assessment.score,
    alertId: alert?.id ?? null,
  });

  return {
    eventId,
    riskScore: assessment.score,
    severity: assessment.severity,
    alertId: alert?.id ?? null,
    alertCreated,
  };
}
