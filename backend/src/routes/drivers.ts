import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../auth';
import { db } from '../db';
import {
  acceptInvite,
  cancelInvite,
  createInvite,
  listDrivers,
  listPendingInvites,
  MAX_DRIVERS,
  removeDriver,
  sendDriverInviteEmail,
} from '../drivers';
import { DeviceRow } from '../types';

export const driversRouter = Router();

const getDeviceById = db.prepare<[string], DeviceRow>(`SELECT * FROM devices WHERE id = ?`);

driversRouter.get('/devices/:id/drivers', requireAuth, (req, res) => {
  const device = getDeviceById.get(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  return res.json({
    drivers: listDrivers(device.id),
    pendingInvites: listPendingInvites(device.id),
    maxDrivers: MAX_DRIVERS,
  });
});

const inviteSchema = z.object({ email: z.string().email() });

driversRouter.post('/devices/:id/drivers/invite', requireAuth, async (req, res) => {
  const device = getDeviceById.get(req.params.id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let invite: { id: string; code: string };
  try {
    invite = createInvite(device, parsed.data.email, req.user!);
  } catch (err) {
    return res.status(409).json({ error: err instanceof Error ? err.message : 'failed to create invite' });
  }

  try {
    await sendDriverInviteEmail(device, req.user!, parsed.data.email, invite.code);
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'failed to send invite email' });
  }

  return res.status(201).json({ ok: true });
});

driversRouter.delete('/devices/:id/drivers/:userId', requireAuth, (req, res) => {
  removeDriver(req.params.id, req.params.userId);
  return res.json({ ok: true });
});

driversRouter.delete('/devices/:id/drivers/invites/:inviteId', requireAuth, (req, res) => {
  cancelInvite(req.params.id, req.params.inviteId);
  return res.json({ ok: true });
});

const acceptSchema = z.object({ code: z.string().min(4).max(20) });

driversRouter.post('/drivers/accept-invite', requireAuth, (req, res) => {
  const parsed = acceptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = acceptInvite(parsed.data.code, req.user!);
    return res.json({ ok: true, deviceId: result.deviceId });
  } catch (err) {
    return res.status(409).json({ error: err instanceof Error ? err.message : 'failed to accept invite' });
  }
});
