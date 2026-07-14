import { randomBytes, randomUUID } from 'node:crypto';
import { Resend } from 'resend';

import { config } from './config';
import { db } from './db';
import { PublicUser } from './auth';
import { DeviceRow, DriverInviteRow } from './types';

export const MAX_DRIVERS = 5;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Unambiguous charset (no 0/O, 1/I/L) so the code is easy to read back and type.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < bytes.length; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}

const getDriverCountStmt = db.prepare<[string], { count: number }>(
  `SELECT COUNT(*) as count FROM device_drivers WHERE device_id = ?`,
);
const getPendingInviteCountStmt = db.prepare<[string, number], { count: number }>(
  `SELECT COUNT(*) as count FROM driver_invites WHERE device_id = ? AND accepted_at IS NULL AND expires_at > ?`,
);
const insertDriver = db.prepare(
  `INSERT INTO device_drivers (id, device_id, user_id, joined_at) VALUES (?, ?, ?, ?)`,
);
const findDriver = db.prepare(`SELECT 1 FROM device_drivers WHERE device_id = ? AND user_id = ?`);
const findDriverByEmail = db.prepare(
  `SELECT 1 FROM device_drivers dd JOIN users u ON u.id = dd.user_id WHERE dd.device_id = ? AND u.email = ?`,
);
const getInviteByCode = db.prepare<[string], DriverInviteRow>(`SELECT * FROM driver_invites WHERE code = ?`);

export type DriverSummary = { id: string; name: string; email: string; joinedAt: number };
export type PendingInviteSummary = { id: string; email: string; createdAt: number; expiresAt: number };

export function getDriverCount(deviceId: string): number {
  return getDriverCountStmt.get(deviceId)!.count;
}

export function getPendingInviteCount(deviceId: string): number {
  return getPendingInviteCountStmt.get(deviceId, Date.now())!.count;
}

export function addDriver(deviceId: string, userId: string): void {
  if (findDriver.get(deviceId, userId)) return;
  insertDriver.run(randomUUID(), deviceId, userId, Date.now());
}

// Single-device prototype bootstrap: the very first person to ever log in
// becomes this device's first driver automatically. Anyone after that needs
// an invite — see createInvite/acceptInvite below.
export function ensureBootstrapDriver(deviceId: string, userId: string): void {
  if (getDriverCount(deviceId) === 0) {
    addDriver(deviceId, userId);
  }
}

export function listDrivers(deviceId: string): DriverSummary[] {
  return db
    .prepare<[string], DriverSummary>(
      `SELECT u.id as id, u.name as name, u.email as email, dd.joined_at as joinedAt
       FROM device_drivers dd JOIN users u ON u.id = dd.user_id
       WHERE dd.device_id = ? ORDER BY dd.joined_at ASC`,
    )
    .all(deviceId);
}

export function listPendingInvites(deviceId: string): PendingInviteSummary[] {
  return db
    .prepare<[string, number], PendingInviteSummary>(
      `SELECT id, email, created_at as createdAt, expires_at as expiresAt
       FROM driver_invites WHERE device_id = ? AND accepted_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC`,
    )
    .all(deviceId, Date.now());
}

export function createInvite(device: DeviceRow, email: string, invitedBy: PublicUser): { id: string; code: string } {
  const normalizedEmail = email.toLowerCase();
  if (getDriverCount(device.id) + getPendingInviteCount(device.id) >= MAX_DRIVERS) {
    throw new Error(`this car already has the maximum of ${MAX_DRIVERS} drivers (including pending invites)`);
  }
  if (findDriverByEmail.get(device.id, normalizedEmail)) {
    throw new Error('this person is already a driver');
  }

  const id = randomUUID();
  const code = generateCode();
  const now = Date.now();
  db.prepare(
    `INSERT INTO driver_invites (id, device_id, code, email, invited_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, device.id, code, normalizedEmail, invitedBy.id, now, now + INVITE_TTL_MS);

  return { id, code };
}

export async function sendDriverInviteEmail(
  device: DeviceRow,
  invitedBy: PublicUser,
  toEmail: string,
  code: string,
): Promise<void> {
  if (!config.resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured on the backend');
  }

  const resend = new Resend(config.resendApiKey);
  const { error } = await resend.emails.send({
    from: config.resendFromEmail,
    to: toEmail,
    subject: `${invitedBy.name} invited you to drive ${device.name} on Guardian Drive`,
    text:
      `Hello,\n\n${invitedBy.name} added you as a driver for ${device.name} on Guardian Drive.\n\n` +
      `Download the Guardian Drive app, create an account, then enter this invite code when ` +
      `logging in:\n\n  ${code}\n\nThis code expires in 7 days.\n\nGuardian Drive`,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export function acceptInvite(code: string, user: PublicUser): { deviceId: string } {
  const invite = getInviteByCode.get(code.toUpperCase().trim());
  if (!invite) throw new Error('invalid invite code');
  if (invite.accepted_at) throw new Error('this invite has already been used');
  if (invite.expires_at < Date.now()) throw new Error('this invite code has expired');
  if (invite.email !== user.email.toLowerCase()) {
    throw new Error('this invite was sent to a different email address');
  }
  if (getDriverCount(invite.device_id) >= MAX_DRIVERS) {
    throw new Error(`this car already has the maximum of ${MAX_DRIVERS} drivers`);
  }

  addDriver(invite.device_id, user.id);
  db.prepare(`UPDATE driver_invites SET accepted_at = ?, accepted_by = ? WHERE id = ?`).run(
    Date.now(),
    user.id,
    invite.id,
  );
  return { deviceId: invite.device_id };
}

export function removeDriver(deviceId: string, userId: string): void {
  db.prepare(`DELETE FROM device_drivers WHERE device_id = ? AND user_id = ?`).run(deviceId, userId);
}

export function cancelInvite(deviceId: string, inviteId: string): void {
  db.prepare(`DELETE FROM driver_invites WHERE device_id = ? AND id = ?`).run(deviceId, inviteId);
}
