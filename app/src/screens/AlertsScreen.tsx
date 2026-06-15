import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState } from '../state/AppStateContext';
import { EventSeverity } from '../types/app';

type IoniconName = keyof typeof Ionicons.glyphMap;

const severityStyles: Record<EventSeverity, { icon: IoniconName; color: string; bg: string }> = {
  info: { icon: 'information-circle-outline', color: colors.cyan, bg: colors.cyanSoft },
  warning: { icon: 'warning-outline', color: colors.amberWarn, bg: colors.amberSoft },
  critical: { icon: 'alert-circle-outline', color: colors.redAlert, bg: colors.redSoft },
};

export function AlertsScreen() {
  const { state } = useAppState();
  const events = state.recentActivity;

  return (
    <Screen scroll>
      <ScreenHeader title="Alerts" subtitle="Event history for the last 24 hours" />

      {events.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIconFrame}>
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.emerald} />
          </View>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptySubtitle}>No alerts in the last 24 hours</Text>
        </Card>
      ) : (
        events.map((event) => {
          const severity = severityStyles[event.severity];
          return (
            <Card key={event.id} style={styles.eventCard}>
              <View style={[styles.eventIconFrame, { backgroundColor: severity.bg }]}>
                <Ionicons name={severity.icon} size={20} color={severity.color} />
              </View>
              <View style={styles.eventTextBlock}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
              </View>
              <Text style={styles.eventTime}>{event.timeLabel}</Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIconFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.emeraldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  eventIconFrame: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTextBlock: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  eventSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  eventTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
});
