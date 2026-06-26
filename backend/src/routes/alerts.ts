import { Router } from 'express';
import { z } from 'zod';

import { db } from '../db';
import { lockEvidence, verifyEvidence } from '../evidenceVault';
import { broadcast } from '../live';
import { buildPolicePackPdf, sendPolicePackEmail } from '../policePack';
import { toActivityEvent } from '../presenter';
import { queueCommand } from './commands';
import { AlertRow, DeviceRow, EventRow } from '../types';

export const alertsRouter = Router();

const getAlert = db.prepare<[string], AlertRow>(`SELECT * FROM alerts WHERE id = ?`);
const getDeviceById = db.prepare<[string], DeviceRow>(`SELECT * FROM devices WHERE id = ?`);

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

// Owner marks the vehicle as recovered: closes out the recovery, returns the
// device to 'protected', and stops surfacing this alert as the device's
// latestConfirmedAlertId (which is what gates the Police Pack button). The
// alert row itself stays 'confirmed' and its evidence stays locked/available
// via GET /evidence — nothing here deletes or unlocks anything.
alertsRouter.post('/:id/recovered', (req, res) => {
  const alert = getAlert.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });
  if (alert.status !== 'confirmed') {
    return res.status(409).json({ error: `alert is ${alert.status}, not confirmed` });
  }

  db.prepare(`UPDATE devices SET status = 'protected' WHERE id = ?`).run(alert.device_id);
  broadcast(alert.device_id, { type: 'vehicle_recovered', alertId: alert.id });
  return res.json({ ok: true });
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

const policePackSchema = z.object({
  recipientName: z.string().min(1).max(120),
  recipientEmail: z.string().email(),
});

// Generates the incident PDF and emails it directly to the given recipient.
// The PDF bytes never leave the server — the app only ever sees { ok: true }
// or an error, never the file itself or a download link.
alertsRouter.post('/:id/police-pack', async (req, res) => {
  const alert = getAlert.get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });
  if (alert.status !== 'confirmed') {
    return res.status(409).json({ error: 'police pack is only available for confirmed alerts' });
  }

  const parsed = policePackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const device = getDeviceById.get(alert.device_id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const events = db
    .prepare<[string], EventRow>(`SELECT * FROM events WHERE alert_id = ? ORDER BY created_at ASC`)
    .all(alert.id);
  const verification = verifyEvidence(alert);

  try {
    const pdfBuffer = await buildPolicePackPdf(device, alert, events, parsed.data.recipientName, verification);
    await sendPolicePackEmail({
      toEmail: parsed.data.recipientEmail,
      recipientName: parsed.data.recipientName,
      device,
      alert,
      pdfBuffer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to send police pack';
    return res.status(502).json({ error: message });
  }

  return res.json({ ok: true });
});
