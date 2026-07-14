import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'guardian.db'),
  // Optional shared secret for device ingestion. When unset, ingestion is open (prototype mode).
  deviceApiKey: process.env.DEVICE_API_KEY ?? null,
  // Events within this window are treated as one cluster by the risk engine.
  clusterWindowMs: 2 * 60 * 1000,
  // A cluster scoring at or above this creates an alert.
  alertThreshold: 70,
  // Resend (resend.com) — used to email the Police Pack PDF directly to the
  // recipient. Police Pack requests fail with 503 until this is set.
  resendApiKey: process.env.RESEND_API_KEY ?? null,
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? 'Guardian Drive <onboarding@resend.dev>',
  // This is a single-device prototype: there's no "register your car" flow,
  // so the first user to ever log in is auto-added as this device's first
  // driver. Everyone after that needs an invite. See drivers.ts.
  defaultDeviceId: process.env.DEFAULT_DEVICE_ID ?? 'demo-device',
};
