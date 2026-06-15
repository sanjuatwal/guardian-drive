import { Router } from 'express';
import { z } from 'zod';

import { getDevice, ingestEvent } from '../eventIngest';
import { SensorEventType } from '../types';

export const legacyEventsRouter = Router();

// Maps guardian-firmware's internal sensor_type strings (see main.cpp:
// emitTiltEvent, emitImpactEvent, evaluateTiltEscalation) to backend
// SensorEventTypes. Unmapped types are accepted (HTTP 200) but not scored, so
// future firmware sensor types don't break ingestion.
const SENSOR_TYPE_MAP: Record<string, SensorEventType> = {
  imu_tilt: 'tilt',
  impact: 'impact',
  tilt_mode_advice: 'tilt_advisory',
  theft_auto_trigger: 'theft_confirmed',
};

const bodySchema = z.object({
  device_id: z.string().min(1),
  event_id: z.number().optional(),
  sensor_type: z.string().min(1),
  severity: z.number().optional(),
  timestamp_ms: z.number().optional(),
  payload: z.string().optional(),
});

// Legacy ingestion endpoint consumed by guardian-firmware's
// AlertsWiFi::sendEvent (POST {BACKEND_URL}/api/events), which expects a
// plain HTTP 200 on success. Kept separate from /api/v1 so the firmware's
// flatter event shape doesn't leak into the structured API.
legacyEventsRouter.post('/events', (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const input = parsed.data;

  const device = getDevice.get(input.device_id);
  if (!device) return res.status(404).json({ error: 'device not found' });

  const type = SENSOR_TYPE_MAP[input.sensor_type];
  if (!type) {
    return res.status(200).json({ ignored: true, reason: 'unknown sensor_type' });
  }

  const result = ingestEvent(device, type, { detail: input.payload });
  return res.status(200).json(result);
});
