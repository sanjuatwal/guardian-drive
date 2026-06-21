import { Router } from 'express';

import { db } from '../db';
import { lockEvidence, verifyEvidence } from '../evidenceVault';
import { broadcast } from '../live';
import { toActivityEvent } from '../presenter';
import { queueCommand } from './commands';
import { AlertRow, EventRow } from '../types';

export const alertsRouter = Router();

const getAlert = db.prepare<[string], AlertRow>(`SELECT * FROM alerts WHERE id = ?`);

// Owner tapped "Confirm Theft": device enters recovery, evidence is hash-locked.
alertsRouter.post('/:id/confirm', (req, res) => {
  const alert = getAlert.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });
  if (alert.status !== 'active') {
    return res.status(409).json({ error: `alert already ${alert.status}` });
  }

  const now = Date.now();
  db.prepare(`UPDATE alerts SET status = 'confirmed', resolved_at = ? WHERE id = ?`).run(now, alert.id);
  db.prepare(`UPDATE devices SET status = 'recovery' WHERE id = ?`).run(alert.device_id);

  // Keep the siren going (or force it on if the device was in a non-theft state).
  queueCommand(alert.device_id, 'siren_on');

  const evidence = lockEvidence({ ...alert, status: 'confirmed', resolved_at: now });

  broadcast(alert.device_id, { type: 'alert_confirmed', alertId: alert.id });
  return res.json({ ok: true, status: 'confirmed', evidence });
});

// Owner tapped "It's Me — False Alarm".
alertsRouter.post('/:id/dismiss', (req, res) => {
  const alert = getAlert.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });
  if (alert.status !== 'active') {
    return res.status(409).json({ error: `alert already ${alert.status}` });
  }

  const now = Date.now();
  db.prepare(`UPDATE alerts SET status = 'dismissed', resolved_at = ? WHERE id = ?`).run(now, alert.id);
  db.prepare(`UPDATE devices SET status = 'protected' WHERE id = ?`).run(alert.device_id);
  // Release the cluster so future alerts can claim these events.
  db.prepare(`UPDATE events SET alert_id = NULL WHERE alert_id = ? AND locked = 0`).run(alert.id);

  // Tell the firmware to silence the siren — it polls GET /api/commands.
  queueCommand(alert.device_id, 'siren_off');

  broadcast(alert.device_id, { type: 'alert_dismissed', alertId: alert.id });
  return res.json({ ok: true, status: 'dismissed' });
});

// Evidence bundle for police/insurance export, with chain verification.
alertsRouter.get('/:id/evidence', (req, res) => {
  const alert = getAlert.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });
  if (alert.status !== 'confirmed') {
    return res.status(409).json({ error: 'evidence is only available for confirmed alerts' });
  }

  const events = db
    .prepare<[string], EventRow>(`SELECT * FROM events WHERE alert_id = ? ORDER BY created_at ASC`)
    .all(alert.id);
  const verification = verifyEvidence(alert);

  return res.json({
    alertId: alert.id,
    deviceId: alert.device_id,
    riskScore: alert.risk_score,
    reasons: JSON.parse(alert.reasons_json) as string[],
    confirmedAt: alert.resolved_at,
    evidenceHash: alert.evidence_hash,
    chainValid: verification.valid,
    timeline: events.map((event) => ({
      ...toActivityEvent(event),
      timestamp: event.created_at,
      locked: Boolean(event.locked),
    })),
  });
});
