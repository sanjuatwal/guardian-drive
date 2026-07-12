import { eventTitle, MAINTENANCE_LABELS } from './riskEngine';
import { ActivityEvent, AlertRow, AppState, DeviceRow, DeviceSummary, EventRow } from './types';

const STATUS_LABELS: Record<DeviceRow['status'], string> = {
  protected: 'Protected',
  service: 'Service Mode',
  alert: 'Theft Alert',
  recovery: 'Recovery Active',
  offline: 'Offline',
  degraded: 'Degraded',
};

export function relativeLabel(timestamp: number | null, now = Date.now()): string {
  if (!timestamp) return 'Never';
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function toDeviceSummary(device: DeviceRow, now = Date.now()): DeviceSummary {
  return {
    name: device.name,
    status: device.status,
    statusLabel: STATUS_LABELS[device.status],
    lastUpdateLabel: relativeLabel(device.last_seen_at, now),
    gpsStatus: device.gps_ok ? 'Locked' : 'No Fix',
    lteStatus: device.lte_ok ? 'Connected' : 'No Signal',
    backupBattery: `${device.battery_pct}%`,
    keyTagStatus: device.key_tag_present ? 'Nearby' : 'Not Detected',
    locationLabel: device.location_label ?? 'Unknown',
    maintenanceMode: device.maintenance_mode,
    maintenanceModeLabel: MAINTENANCE_LABELS[device.maintenance_mode],
  };
}

export function toActivityEvent(event: EventRow, now = Date.now()): ActivityEvent {
  const payload = JSON.parse(event.payload_json) as Record<string, unknown>;
  const detail = typeof payload.detail === 'string' ? payload.detail : null;
  return {
    id: event.id,
    title: eventTitle(event.type),
    subtitle: detail ?? `Risk score ${event.risk_score}`,
    timeLabel: relativeLabel(event.created_at, now),
    severity: event.severity,
  };
}

export function toAppState(
  device: DeviceRow,
  events: EventRow[],
  activeAlert: AlertRow | null,
  latestConfirmedAlertId: string | null,
): AppState {
  const now = Date.now();
  return {
    device: toDeviceSummary(device, now),
    recentActivity: events.map((event) => toActivityEvent(event, now)),
    currentAlert: activeAlert
      ? {
          id: activeAlert.id,
          title: 'Possible Vehicle Theft',
          reasons: JSON.parse(activeAlert.reasons_json) as string[],
        }
      : null,
    latestConfirmedAlertId,
    privacyMode: device.privacy_mode,
  };
}
