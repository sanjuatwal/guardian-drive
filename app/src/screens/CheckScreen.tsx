import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { useProximity, ProximityStatus } from '../ble/useProximity';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useDeviceSummary } from '../state/AppStateContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

type CheckRowProps = {
  icon: IoniconName;
  label: string;
  subtitle: string;
};

function CheckRow({ icon, label, subtitle }: CheckRowProps) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={styles.rowIconFrame}>
        <Ionicons name={icon} size={18} color={colors.emerald} />
      </View>
      <View style={styles.rowTextBlock}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function proximitySubtitle(status: ProximityStatus, rssi: number | null): string {
  switch (status) {
    case 'connected':
      return rssi != null ? `Phone near vehicle · ${rssi} dBm` : 'Phone near vehicle';
    case 'scanning':
      return 'Searching for vehicle…';
    case 'connecting':
      return 'Linking to vehicle…';
    case 'bluetooth-off':
      return 'Turn on Bluetooth to detect proximity';
    case 'permission-denied':
      return 'Bluetooth permission needed';
    case 'error':
      return 'Bluetooth link error';
    default:
      return 'Idle';
  }
}

export function CheckScreen() {
  const device = useDeviceSummary();
  const proximity = useProximity();

  const rows: CheckRowProps[] = [
    { icon: 'heart-outline', label: 'Device Health', subtitle: 'All systems operational' },
    { icon: 'construct-outline', label: 'Maintenance Mode', subtitle: `Service · Valet · Towing · ${device.maintenanceModeLabel}` },
    {
      icon: 'bluetooth-outline',
      label: 'Phone Link (BLE)',
      subtitle: proximitySubtitle(proximity.status, proximity.rssi),
    },
    { icon: 'key-outline', label: 'Key Tag', subtitle: device.keyTagStatus },
    { icon: 'battery-charging-outline', label: 'Backup Battery', subtitle: device.backupBattery },
    { icon: 'terminal-outline', label: 'System Diagnostics', subtitle: 'Run full check' },
    { icon: 'shield-checkmark-outline', label: 'Protection Status', subtitle: device.statusLabel },
  ];

  return (
    <Screen scroll>
      <ScreenHeader title="Guardian Check" subtitle="Device health and diagnostics" />

      <Card style={styles.listCard}>
        {rows.map((row, index) => (
          <View key={row.label}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <CheckRow {...row} />
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listCard: {
    padding: spacing.sm,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowIconFrame: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing.md + 38 + spacing.md,
  },
});
