import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { useDeviceSummary } from '../state/AppStateContext';

const quickActions = [
  { label: 'View Location', icon: '📍' },
  { label: 'Service Mode', icon: '⚙️' },
  { label: 'Find Key Tag', icon: '🔑' },
  { label: 'Trigger Siren', icon: '🚨' },
];

export function HomeScreen() {
  const device = useDeviceSummary();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <View style={styles.logoFrame}>
            <Image source={require('../../theme/assets/brand-logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </View>
        <View style={styles.statusPillContainer}>
          <View style={styles.statusPill}>
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusLabel}>{device.statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Hero Card with Emerald Glow Border */}
      <View style={styles.heroBorderGrow} />
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>{device.name}</Text>
            <Text style={styles.heroBody}>Vehicle protected and monitored</Text>
          </View>
          <Text style={styles.heroMeta}>{device.lastUpdateLabel}</Text>
        </View>
        <View style={styles.heroImagePlaceholder}>
          <Text style={styles.heroImageIcon}>🚗</Text>
          <Text style={styles.heroImageText}>Dashboard Visual</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.grid}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.75}>
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Protection Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryChip}>
          <Text style={styles.chipIcon}>🛰️</Text>
          <Text style={styles.chipLabel}>GPS</Text>
          <Text style={styles.chipValue}>{device.gpsStatus}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.chipIcon}>📡</Text>
          <Text style={styles.chipLabel}>LTE</Text>
          <Text style={styles.chipValue}>{device.lteStatus}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.chipIcon}>🔋</Text>
          <Text style={styles.chipLabel}>Battery</Text>
          <Text style={styles.chipValue}>{device.backupBattery}</Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.chipIcon}>🔑</Text>
          <Text style={styles.chipLabel}>Key Tag</Text>
          <Text style={styles.chipValue}>{device.keyTagStatus}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Recent Activity</Text>
      {device.status === 'protected' ? (
        <View style={styles.activityCard}>
          <Text style={styles.activityDot}>●</Text>
          <View style={styles.activityTextBlock}>
            <Text style={styles.activityTitle}>System Check Complete</Text>
            <Text style={styles.activitySubtitle}>All systems operational</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.deepBlack,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  logoFrame: {
    width: 270,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  statusPillContainer: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderColor: colors.emerald,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusDot: {
    color: colors.emerald,
    fontSize: 10,
  },
  statusLabel: {
    color: colors.emerald,
    fontSize: 13,
    fontWeight: '600',
  },
  heroBorderGrow: {
    position: 'absolute',
    top: 120,
    left: spacing.lg,
    right: spacing.lg,
    height: 240,
    borderRadius: radius.xl,
    backgroundColor: colors.emerald,
    opacity: 0.08,
    zIndex: 0,
  },
  heroCard: {
    backgroundColor: colors.graphite,
    borderColor: colors.emerald,
    borderWidth: 2,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    zIndex: 1,
  },
  heroTop: {
    gap: spacing.sm,
  },
  heroTextBlock: {
    gap: spacing.xs,
  },
  heroLabel: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
  },
  heroMeta: {
    color: colors.emerald,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  heroImagePlaceholder: {
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.carbon,
    borderColor: colors.emerald,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  heroImageIcon: {
    fontSize: 48,
  },
  heroImageText: {
    color: colors.emerald,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  summaryChip: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipIcon: {
    fontSize: 20,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  chipValue: {
    color: colors.emerald,
    fontSize: 11,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: colors.graphite,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  activityDot: {
    color: colors.emerald,
    fontSize: 8,
    marginTop: spacing.sm,
  },
  activityTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  activitySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
