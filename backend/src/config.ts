import path from 'node:path';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'guardian.db'),
  // Optional shared secret for device ingestion. When unset, ingestion is open (prototype mode).
  deviceApiKey: process.env.DEVICE_API_KEY ?? null,
  // Events within this window are treated as one cluster by the risk engine.
  clusterWindowMs: 10 * 60 * 1000,
  // A cluster scoring at or above this creates an alert.
  alertThreshold: 70,
};
