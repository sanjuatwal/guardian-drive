import { MockAppState } from '../types/app';

export const mockAppState: MockAppState = {
  device: {
    name: 'Guardian Drive',
    status: 'protected',
    statusLabel: 'Vehicle Protected',
    lastUpdateLabel: 'Last update: 10:24 PM',
    gpsStatus: 'Strong',
    lteStatus: 'Strong',
    backupBattery: '92%',
    keyTagStatus: 'Connected',
    locationLabel: 'Oak Ave, Sector 17, New York, NY',
    maintenanceMode: 'off',
    maintenanceModeLabel: 'Off',
  },
  recentActivity: [
    {
      id: 'evt-1',
      title: 'System Check Complete',
      subtitle: 'All systems operational',
      timeLabel: '10:24 PM',
      severity: 'info',
    },
  ],
  currentAlert: null,
  latestConfirmedAlertId: null,
  privacyMode: 'balanced',
};
