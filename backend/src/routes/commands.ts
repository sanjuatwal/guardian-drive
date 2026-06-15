import { randomUUID } from 'node:crypto';
import { Router } from 'express';

import { db } from '../db';
import { CommandRow } from '../types';

export const commandsRouter = Router();

const getUndelivered = db.prepare<[string], CommandRow>(
  `SELECT * FROM commands WHERE device_id = ? AND delivered_at IS NULL ORDER BY created_at ASC`,
);
const markDelivered = db.prepare(`UPDATE commands SET delivered_at = ? WHERE id = ?`);

// Polled by guardian-firmware's AlertsWiFi::checkFalseAlarm
// (GET {BACKEND_URL}/api/commands?device_id=...). Returns and consumes any
// pending commands for the device — currently only "siren_off".
commandsRouter.get('/commands', (req, res) => {
  const deviceId = String(req.query.device_id ?? '');
  if (!deviceId) return res.status(400).json({ error: 'device_id required' });

  const pending = getUndelivered.all(deviceId);
  const now = Date.now();
  for (const row of pending) {
    markDelivered.run(now, row.id);
  }

  return res.json({ commands: pending.map((row) => row.command) });
});

export function queueCommand(deviceId: string, command: string): void {
  db.prepare(`INSERT INTO commands (id, device_id, command, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    deviceId,
    command,
    Date.now(),
  );
}
