import { createHash } from 'node:crypto';

import { db } from './db';
import { AlertRow, EventRow } from './types';

// Hash-chains every event tied to an alert and locks the rows. The final hash
// changes if any event in the chain is altered, giving the timeline
// tamper-evidence for police/insurance export.
export function lockEvidence(alert: AlertRow): { hash: string; eventCount: number } {
  const events = db
    .prepare<[string], EventRow>(
      `SELECT * FROM events WHERE alert_id = ? ORDER BY created_at ASC, id ASC`,
    )
    .all(alert.id);

  let hash = createHash('sha256').update(alert.id).digest('hex');
  for (const event of events) {
    const canonical = JSON.stringify({
      id: event.id,
      device_id: event.device_id,
      type: event.type,
      severity: event.severity,
      risk_score: event.risk_score,
      payload: event.payload_json,
      created_at: event.created_at,
    });
    hash = createHash('sha256').update(hash).update(canonical).digest('hex');
  }

  const lockAll = db.transaction(() => {
    db.prepare(`UPDATE events SET locked = 1 WHERE alert_id = ?`).run(alert.id);
    db.prepare(`UPDATE alerts SET evidence_hash = ? WHERE id = ?`).run(hash, alert.id);
  });
  lockAll();

  return { hash, eventCount: events.length };
}

export function verifyEvidence(alert: AlertRow): { valid: boolean; expected: string | null; actual: string } {
  const events = db
    .prepare<[string], EventRow>(
      `SELECT * FROM events WHERE alert_id = ? ORDER BY created_at ASC, id ASC`,
    )
    .all(alert.id);

  let hash = createHash('sha256').update(alert.id).digest('hex');
  for (const event of events) {
    const canonical = JSON.stringify({
      id: event.id,
      device_id: event.device_id,
      type: event.type,
      severity: event.severity,
      risk_score: event.risk_score,
      payload: event.payload_json,
      created_at: event.created_at,
    });
    hash = createHash('sha256').update(hash).update(canonical).digest('hex');
  }

  return { valid: alert.evidence_hash === hash, expected: alert.evidence_hash, actual: hash };
}
