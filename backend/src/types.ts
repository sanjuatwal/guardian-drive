// Mirrors app/src/types/app.ts so the app can consume /state responses directly.
export type DeviceStatus = 'protected' | 'service' | 'alert' | 'recovery' | 'offline' | 'degraded';
export type PrivacyMode = 'private' | 'balanced' | 'recovery' | 'always-on';
export type EventSeverity = 'info' | 'warning' | 'critical';

export type SensorEventType =
  | 'heartbeat'
  | 'door_open'
  | 'motion'
  | 'tilt'
  | 'tilt_advisory'
  | 'impact'
  | 'glass_break'
  | 'power_cut'
  | 'unauthorized_start'
  | 'obd_tamper'
  | 'gps_jamming'
  | 'key_tag_lost'
  | 'key_tag_found'
  | 'theft_confirmed';

export type DeviceRow = {
  id: string;
  name: string;
  status: DeviceStatus;
  battery_pct: number;
  key_tag_present: number;
  gps_ok: number;
  lte_ok: number;
  lat: number | null;
  lng: number | null;
  location_label: string | null;
  privacy_mode: PrivacyMode;
  service_mode: number;
  last_seen_at: number | null;
};

export type EventRow = {
  id: string;
  device_id: string;
  type: SensorEventType;
  severity: EventSeverity;
  risk_score: number;
  payload_json: string;
  alert_id: string | null;
  locked: number;
  created_at: number;
};

export type CommandRow = {
  id: string;
  device_id: string;
  command: string;
  created_at: number;
  delivered_at: number | null;
};

export type AlertStatus = 'active' | 'confirmed' | 'dismissed';

export type AlertRow = {
  id: string;
  device_id: string;
  status: AlertStatus;
  risk_score: number;
  reasons_json: string;
  evidence_hash: string | null;
  created_at: number;
  resolved_at: number | null;
};

// App-facing shapes (must stay in sync with app/src/types/app.ts).
export type DeviceSummary = {
  name: string;
  status: DeviceStatus;
  statusLabel: string;
  lastUpdateLabel: string;
  gpsStatus: string;
  lteStatus: string;
  backupBattery: string;
  keyTagStatus: string;
  locationLabel: string;
  serviceModeLabel: string;
};

export type ActivityEvent = {
  id: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  severity: EventSeverity;
};

export type AlertSummary = {
  id?: string;
  title: string;
  reasons: string[];
  countdownLabel?: string;
};

export type AppState = {
  device: DeviceSummary;
  recentActivity: ActivityEvent[];
  currentAlert: AlertSummary | null;
  privacyMode: PrivacyMode;
};
