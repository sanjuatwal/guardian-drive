import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';

import { config } from '../config';
import { db } from '../db';
import { getActiveAlert, getDevice, getRecentEvents, ingestEvent } from '../eventIngest';
import { broadcast } from '../live';
import { toActivityEvent, toAppState } from '../presenter';
import { queueCommand } from './commands';
import { DeviceRow, SensorEventType } from '../types';

export const devicesRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  privacyMode: z.enum(['private', 'balanced', 'recovery', 'always-on']).optional(),
});

const eventSchema = z.object({
  type: z.enum([
    'heartbeat',
    'door_open',
    'motion',
    'tilt',
    'impact',
    'glass_break',
    'power_cut',
    'unauthorized_start',
    'obd_tamper',
    'gps_jamming',
    'key_tag_lost',
    'key_tag_found',
  ]),
  detail: z.string().max(200).optional(),
  batteryPct: z.number().int().min(0).max(100).optional(),
  keyTagPresent: z.boolean().optional(),
  gpsOk: z.boolean().optional(),
  lteOk: z.boolean().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  locationLabel: z.string().max(120).optional(),
});

function requireDevice(id: string): DeviceRow | null {
  return getDevice.get(id) ?? null;
}

devicesRouter.post('/', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO devices (id, name, privacy_mode, last_seen_at) VALUES (?, ?, ?, ?)`,
  ).run(id, parsed.data.name, parsed.data.privacyMode ?? 'balanced', Date.now());
  return res.status(201).json({ id, name: parsed.data.name });
});

devicesRouter.get('/:id/state', (req, res) => {
  const device = requireDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const events = getRecentEvents.all(device.id, 20);
  const alert = getActiveAlert.get(device.id) ?? null;
  return res.json(toAppState(device, events, alert));
});

devicesRouter.get('/:id/events', (req, res) => {
  const device = requireDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const events = getRecentEvents.all(device.id, limit);
  return res.json({ events: events.map((event) => toActivityEvent(event)) });
});

// Firmware ingestion endpoint. Each event updates device vitals, gets risk
// scored against the recent cluster, and may open an alert.
devicesRouter.post('/:id/events', (req, res) => {
  if (config.deviceApiKey && req.header('x-device-key') !== config.deviceApiKey) {
    return res.status(401).json({ error: 'invalid device key' });
  }

  const device = requireDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const input = parsed.data;

  const result = ingestEvent(device, input.type as SensorEventType, {
    detail: input.detail,
    batteryPct: input.batteryPct,
    keyTagPresent: input.keyTagPresent,
    gpsOk: input.gpsOk,
    lteOk: input.lteOk,
    lat: input.lat,
    lng: input.lng,
    locationLabel: input.locationLabel,
  });

  return res.status(201).json(result);
});

devicesRouter.post('/:id/commands/siren', (req, res) => {
  const device = requireDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });
  queueCommand(device.id, 'siren_on');
  return res.json({ ok: true });
});

devicesRouter.patch('/:id/settings', (req, res) => {
  const device = requireDevice(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const schema = z.object({
    privacyMode: z.enum(['private', 'balanced', 'recovery', 'always-on']).optional(),
    serviceMode: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  db.prepare(
    `UPDATE devices SET
       privacy_mode = COALESCE(?, privacy_mode),
       service_mode = COALESCE(?, service_mode),
       status = CASE
         WHEN ? IS NOT NULL AND ? = 1 THEN 'service'
         WHEN ? IS NOT NULL AND ? = 0 AND status = 'service' THEN 'protected'
         ELSE status
       END
     WHERE id = ?`,
  ).run(
    parsed.data.privacyMode ?? null,
    parsed.data.serviceMode === undefined ? null : Number(parsed.data.serviceMode),
    parsed.data.serviceMode === undefined ? null : 1,
    parsed.data.serviceMode === undefined ? null : Number(parsed.data.serviceMode),
    parsed.data.serviceMode === undefined ? null : 1,
    parsed.data.serviceMode === undefined ? null : Number(parsed.data.serviceMode),
    device.id,
  );

  broadcast(device.id, { type: 'settings' });
  return res.json({ ok: true });
});
