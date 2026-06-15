import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, gradients, radius, spacing } from '../../theme/tokens';
import { Card, SectionLabel } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState } from '../state/AppStateContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

const quickActions: { label: string; icon: IoniconName }[] = [
  { label: 'View Location', icon: 'location-outline' },
  { label: 'Service Mode', icon: 'construct-outline' },
  { label: 'Find Key Tag', icon: 'key-outline' },
  { label: 'Trigger Siren', icon: 'megaphone-outline' },
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
  const { state, connection } = useAppState();
  const device = state.device;

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

      <SectionLabel>Quick Actions</SectionLabel>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.7}>
            <View style={styles.actionIconFrame}>
              <Ionicons name={action.icon} size={20} color={colors.emerald} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
