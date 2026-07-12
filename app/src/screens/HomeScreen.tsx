import React from 'react';
import { Image, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { setMaintenanceMode, stopSiren, triggerSiren } from '../api/client';
import { colors, fonts, gradients, radius, spacing } from '../../theme/tokens';
import { Card, SectionLabel } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState } from '../state/AppStateContext';
import { useAuth } from '../state/AuthContext';
import { MaintenanceMode } from '../types/app';

type IoniconName = keyof typeof Ionicons.glyphMap;

const quickActions: { label: string; icon: IoniconName }[] = [
  { label: 'View Location', icon: 'location-outline' },
  { label: 'Maintenance Mode', icon: 'construct-outline' },
  { label: 'Find Key Tag', icon: 'key-outline' },
  { label: 'Trigger Siren', icon: 'megaphone-outline' },
];

const maintenanceOptions: { mode: MaintenanceMode; label: string; icon: IoniconName }[] = [
  { mode: 'service', label: 'Service Mode', icon: 'construct-outline' },
  { mode: 'valet', label: 'Valet Mode', icon: 'car-sport-outline' },
  { mode: 'towing', label: 'Towing Mode', icon: 'trail-sign-outline' },
];

function LiveBadge({ live }: { live: boolean }) {
  return (
    <View style={[styles.liveBadge, !live && styles.liveBadgeOffline]}>
      <View style={[styles.liveDot, !live && styles.liveDotOffline]} />
      <Text style={[styles.liveText, !live && styles.liveTextOffline]}>
        {live ? 'LIVE' : 'OFFLINE'}
      </Text>
    </View>
  );
}

function SummaryChip({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return (
    <View style={styles.summaryChip}>
      <View style={styles.summaryIconFrame}>
        <Ionicons name={icon} size={16} color={colors.cyan} />
      </View>
      <View style={styles.summaryTextBlock}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

export function HomeScreen() {
  const { state, connection, refresh } = useAppState();
  const { confirmWithBiometrics } = useAuth();
  const [sirenActive, setSirenActive] = React.useState(false);
  const [sirenSeconds, setSirenSeconds] = React.useState(0);
  const [stopBusy, setStopBusy] = React.useState(false);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = React.useState(false);
  const [maintenanceBusy, setMaintenanceBusy] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTriggerSiren = async () => {
    if (sirenActive) return;
    const verified = await confirmWithBiometrics('Confirm you want to trigger the siren');
    if (!verified) return;
    await triggerSiren();
    setSirenSeconds(0);
    setSirenActive(true);
    timerRef.current = setInterval(() => setSirenSeconds((s) => s + 1), 1000);
  };

  const handleStopSiren = async () => {
    if (stopBusy) return;
    setStopBusy(true);
    try {
      await stopSiren();
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setSirenActive(false);
      setSirenSeconds(0);
      setStopBusy(false);
    }
  };

  const applyMaintenance = async (mode: MaintenanceMode) => {
    if (maintenanceBusy) return;
    setMaintenanceBusy(true);
    try {
      await setMaintenanceMode(mode);
      await refresh();
    } finally {
      setMaintenanceBusy(false);
    }
  };

  const sirenTimeLabel = `${String(Math.floor(sirenSeconds / 60)).padStart(2, '0')}:${String(sirenSeconds % 60).padStart(2, '0')}`;

  const device = state.device;
  const maintenanceActive = device.maintenanceMode !== 'off';

  return (
    <Screen scroll>
      <ScreenHeader />

      <LinearGradient
        colors={gradients.cardGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroShieldFrame}>
              <Ionicons name="shield-checkmark" size={20} color={colors.emerald} />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroTitle}>{device.statusLabel}</Text>
              <Text style={styles.heroSubtitle}>{device.lastUpdateLabel}</Text>
            </View>
            <LiveBadge live={connection === 'live'} />
          </View>

          <Image
            source={require('../../theme/assets/hero-car.png')}
            style={styles.heroCar}
            resizeMode="cover"
          />

          <View style={styles.keyTagPill}>
            <Ionicons name="key-outline" size={14} color={colors.emerald} />
            <Text style={styles.keyTagText}>Key Tag: {device.keyTagStatus}</Text>
          </View>
        </View>
      </LinearGradient>

      <Modal visible={sirenActive} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconFrame}>
              <Ionicons name="megaphone" size={32} color={colors.redAlert} />
            </View>
            <Text style={styles.modalTitle}>Siren Active</Text>
            <Text style={styles.modalTimer}>{sirenTimeLabel}</Text>
            <Text style={styles.modalSubtitle}>Siren has been active for the above duration.</Text>
            <TouchableOpacity
              style={[styles.stopButton, stopBusy && styles.actionCardDisabled]}
              activeOpacity={0.85}
              disabled={stopBusy}
              onPress={handleStopSiren}
            >
              <Ionicons name="stop-circle" size={18} color="#fff" />
              <Text style={styles.stopButtonText}>{stopBusy ? 'Stopping…' : 'Stop Siren'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SectionLabel>Quick Actions</SectionLabel>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => {
          const isSiren = action.label === 'Trigger Siren';
          const isMaintenance = action.label === 'Maintenance Mode';
          // The siren is unavailable while a maintenance mode is active.
          const disabled = isSiren && (sirenActive || maintenanceActive);
          const onPress = isSiren
            ? handleTriggerSiren
            : isMaintenance
              ? () => setMaintenanceModalVisible(true)
              : undefined;
          return (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.actionCard,
                disabled && styles.actionCardDisabled,
                isMaintenance && maintenanceActive && styles.actionCardActive,
              ]}
              activeOpacity={0.7}
              disabled={disabled}
              onPress={onPress}
            >
              <View style={styles.actionIconFrame}>
                <Ionicons name={action.icon} size={20} color={colors.emerald} />
              </View>
              <Text style={styles.actionLabel}>
                {isMaintenance && maintenanceActive ? device.maintenanceModeLabel : action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={maintenanceModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.maintenanceCard]}>
            <View style={styles.maintenanceIconFrame}>
              <Ionicons name="construct" size={28} color={colors.cyan} />
            </View>
            <Text style={styles.modalTitle}>Maintenance Mode</Text>
            <Text style={styles.modalSubtitle}>
              Pauses theft alerts and the siren. Location tracking and activity logs stay on.
            </Text>

            <View style={styles.toggleGroup}>
              {maintenanceOptions.map((option) => {
                const active = device.maintenanceMode === option.mode;
                return (
                  <View key={option.mode} style={[styles.toggleRow, active && styles.toggleRowActive]}>
                    <View style={[styles.toggleIconFrame, active && styles.toggleIconFrameActive]}>
                      <Ionicons name={option.icon} size={18} color={active ? colors.cyan : colors.textMuted} />
                    </View>
                    <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                      {option.label}
                    </Text>
                    <Switch
                      value={active}
                      disabled={maintenanceBusy}
                      onValueChange={() => applyMaintenance(active ? 'off' : option.mode)}
                      trackColor={{ false: colors.cardBorder, true: colors.cyan }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.maintenanceDoneButton}
              activeOpacity={0.85}
              onPress={() => setMaintenanceModalVisible(false)}
            >
              <Text style={styles.maintenanceDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SectionLabel>Protection Summary</SectionLabel>
      <View style={styles.summaryGrid}>
        <SummaryChip icon="navigate-outline" label="GPS" value={device.gpsStatus} />
        <SummaryChip icon="cellular-outline" label="LTE" value={device.lteStatus} />
        <SummaryChip icon="battery-charging-outline" label="Backup Battery" value={device.backupBattery} />
        <SummaryChip icon="key-outline" label="Key Tag" value={device.keyTagStatus} />
      </View>

      <SectionLabel>Recent Activity</SectionLabel>
      <Card style={styles.activityCard}>
        {state.recentActivity.length === 0 ? (
          <Text style={styles.activityEmpty}>No recent activity</Text>
        ) : (
          state.recentActivity.slice(0, 4).map((event, index) => (
            <View key={event.id}>
              {index > 0 ? <View style={styles.activityDivider} /> : null}
              <View style={styles.activityRow}>
                <View style={styles.activityIconFrame}>
                  <Ionicons
                    name={event.severity === 'info' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={18}
                    color={
                      event.severity === 'critical'
                        ? colors.redAlert
                        : event.severity === 'warning'
                          ? colors.amberWarn
                          : colors.emerald
                    }
                  />
                </View>
                <View style={styles.activityTextBlock}>
                  <Text style={styles.activityTitle}>{event.title}</Text>
                  <Text style={styles.activitySubtitle}>{event.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{event.timeLabel}</Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    borderRadius: radius.xl,
    padding: 1,
  },
  heroCard: {
    backgroundColor: colors.graphite,
    borderRadius: radius.xl - 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroShieldFrame: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.emeraldSoft,
    borderColor: colors.emeraldBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
  },
  liveBadgeOffline: {
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  liveDotOffline: {
    backgroundColor: colors.textMuted,
  },
  liveText: {
    color: colors.emerald,
    fontSize: 10,
    fontFamily: fonts.black,
    letterSpacing: 1,
  },
  liveTextOffline: {
    color: colors.textMuted,
  },
  heroCar: {
    width: '100%',
    height: 170,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  keyTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    backgroundColor: colors.carbon,
    borderColor: colors.emeraldBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: -spacing.lg,
  },
  keyTagText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.graphite,
    borderColor: colors.redBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  modalIconFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.redAlert,
    fontSize: 20,
    fontFamily: fonts.black,
    letterSpacing: 0.3,
  },
  modalTimer: {
    color: colors.textPrimary,
    fontSize: 48,
    fontFamily: fonts.black,
    letterSpacing: 2,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.redAlert,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionCardActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.cyanSoft,
  },
  maintenanceCard: {
    borderColor: colors.cyan,
  },
  maintenanceIconFrame: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  toggleGroup: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  toggleRowActive: {
    borderColor: colors.cyan,
    backgroundColor: colors.cyanSoft,
  },
  toggleIconFrame: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconFrameActive: {
    backgroundColor: colors.cyanSoft,
  },
  toggleLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  toggleLabelActive: {
    color: colors.cyan,
    fontFamily: fonts.bold,
  },
  maintenanceDoneButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  maintenanceDoneText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
  actionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.graphite,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  actionIconFrame: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryChip: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.graphite,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summaryIconFrame: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextBlock: {
    flex: 1,
    gap: 1,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  activityCard: {
    padding: spacing.sm,
    gap: 0,
  },
  activityEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    padding: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  activityIconFrame: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTextBlock: {
    flex: 1,
    gap: 1,
  },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  activitySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  activityTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing.md + 34 + spacing.md,
  },
});
