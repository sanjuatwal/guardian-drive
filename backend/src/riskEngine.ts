import { config } from './config';
import { DeviceRow, EventRow, EventSeverity, MaintenanceMode, SensorEventType } from './types';

export const MAINTENANCE_LABELS: Record<MaintenanceMode, string> = {
  off: 'Off',
  service: 'Service Mode',
  valet: 'Valet Mode',
  towing: 'Towing Mode',
};

// Base suspicion per event type, before context multipliers.
const BASE_SCORES: Record<SensorEventType, number> = {
  heartbeat: 0,
  key_tag_found: 0,
  tilt_advisory: 0,
  door_open: 15,
  key_tag_lost: 20,
  motion: 25,
  impact: 40,
  gps_jamming: 45,
  tilt: 45,
  obd_tamper: 50,
  power_cut: 55,
  glass_break: 60,
  unauthorized_start: 65,
  theft_confirmed: 100,
};

const EVENT_TITLES: Record<SensorEventType, string> = {
  heartbeat: 'Status check-in',
  key_tag_found: 'Key tag back in range',
  door_open: 'Door opened',
  key_tag_lost: 'Key tag out of range',
  motion: 'Movement while parked',
  impact: 'Impact detected',
  gps_jamming: 'GPS signal jamming suspected',
  tilt: 'Vehicle tilt detected',
  tilt_advisory: 'Tilt detected while you were nearby',
  obd_tamper: 'OBD port tamper detected',
  power_cut: 'Main power cut',
  glass_break: 'Glass break detected',
  unauthorized_start: 'Unauthorized start attempt',
  theft_confirmed: 'No phone or key tag nearby during vehicle movement',
};

export type RiskAssessment = {
  score: number;
  severity: EventSeverity;
  reasons: string[];
  shouldAlert: boolean;
};

export function eventTitle(type: SensorEventType): string {
  return EVENT_TITLES[type];
}

function isNight(timestamp: number): boolean {
  const hour = new Date(timestamp).getHours();
  return hour >= 22 || hour < 6;
}

export function assess(
  device: DeviceRow,
  type: SensorEventType,
  timestamp: number,
  recentEvents: EventRow[],
): RiskAssessment {
  const reasons: string[] = [];
  let score = BASE_SCORES[type];

  if (score > 0) {
    reasons.push(EVENT_TITLES[type]);
  }

  // Maintenance mode (service / valet / towing) suppresses alerting and the
  // siren entirely — someone authorized has the car. The event is still
  // persisted by ingestEvent, so the activity log keeps a record either way.
  if (device.maintenance_mode !== 'off') {
    return {
      score: 0,
      severity: 'info',
      reasons: [`${MAINTENANCE_LABELS[device.maintenance_mode]} active`],
      shouldAlert: false,
    };
  }

  if (score > 0 && !device.key_tag_present) {
    score += 20;
    reasons.push('Key tag not nearby');
  }

  if (score > 0 && isNight(timestamp)) {
    score += 15;
    reasons.push('Occurred during high-risk hours');
  }

  // Cluster bonus: other distinct suspicious event types in the recent window
  // compound the score (e.g. tilt + power cut is far worse than either alone).
  const windowStart = timestamp - config.clusterWindowMs;
  const clusterTypes = new Set(
    recentEvents
      .filter((e) => e.created_at >= windowStart && e.type !== type && BASE_SCORES[e.type] >= 25)
      .map((e) => e.type),
  );
  for (const clusterType of clusterTypes) {
    score += 10;
    reasons.push(`${EVENT_TITLES[clusterType]} in the same window`);
  }

  score = Math.min(score, 100);

  const severity: EventSeverity = score >= config.alertThreshold ? 'critical' : score >= 30 ? 'warning' : 'info';

  return { score, severity, reasons, shouldAlert: score >= config.alertThreshold };
}
