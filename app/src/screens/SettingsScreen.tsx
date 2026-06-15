import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Card, SectionLabel } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState } from '../state/AppStateContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

type SettingRowProps = {
  icon: IoniconName;
  label: string;
  value?: string;
};

function SettingRow({ icon, label, value }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={styles.rowIconFrame}>
        <Ionicons name={icon} size={18} color={colors.cyan} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { state } = useAppState();
  const privacyLabel = state.privacyMode.charAt(0).toUpperCase() + state.privacyMode.slice(1);

  return (
    <Screen scroll>
      <ScreenHeader title="Settings" subtitle="Privacy, alerts, and account" />

      <SectionLabel>Security</SectionLabel>
      <Card style={styles.listCard}>
        <SettingRow icon="eye-off-outline" label="Privacy" value={privacyLabel} />
        <View style={styles.divider} />
        <SettingRow icon="finger-print-outline" label="Biometric Confirmation" value="On" />
      </Card>

      <SectionLabel>Notifications</SectionLabel>
      <Card style={styles.listCard}>
        <SettingRow icon="call-outline" label="Emergency Contacts" />
        <View style={styles.divider} />
        <SettingRow icon="notifications-outline" label="Notification Preferences" />
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
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  rowValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing.md + 36 + spacing.md,
  },
});
