export type DeviceStatus = 'protected' | 'service' | 'alert' | 'recovery' | 'offline' | 'degraded';
export type PrivacyMode = 'private' | 'balanced' | 'recovery' | 'always-on';
export type MaintenanceMode = 'off' | 'service' | 'valet' | 'towing';
export type EventSeverity = 'info' | 'warning' | 'critical';

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
  maintenanceMode: MaintenanceMode;
  maintenanceModeLabel: string;
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

export type MockAppState = {
  device: DeviceSummary;
  recentActivity: ActivityEvent[];
  currentAlert: AlertSummary | null;
  privacyMode: PrivacyMode;
};
