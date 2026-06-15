import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, gradients, radius, spacing } from '../../theme/tokens';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useDeviceSummary } from '../state/AppStateContext';

function LiveBadge() {
  return (
    <View style={styles.liveBadge}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

export function RecoveryScreen() {
  const device = useDeviceSummary();

  return (
    <Screen>
      <ScreenHeader title="Live Recovery" subtitle="Vehicle in motion" right={<LiveBadge />} />

      <LinearGradient
        colors={gradients.cardGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mapGradient}
      >
        <ImageBackground
          source={require('../../theme/assets/map-trail.png')}
          style={styles.mapCard}
          imageStyle={styles.mapImage}
          resizeMode="cover"
        />
      </LinearGradient>

      <Card style={styles.statsCard}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Speed</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValueBig}>68</Text>
            <Text style={styles.statValueUnit}>km/h</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Last Update</Text>
          <Text style={styles.statValue}>{device.lastUpdateLabel}</Text>
        </View>
        <LiveBadge />
      </Card>

      <Card style={styles.locationCard}>
        <Ionicons name="location" size={16} color={colors.emerald} />
        <Text style={styles.locationValue}>{device.locationLabel}</Text>
      </Card>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
          <Ionicons name="shield-half-outline" size={18} color={colors.deepBlack} />
          <Text style={styles.primaryButtonText}>Police Pack</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.emeraldSoft,
    borderColor: colors.emeraldBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.emerald,
  },
  liveText: {
    color: colors.emerald,
    fontSize: 11,
    fontFamily: fonts.black,
    letterSpacing: 1,
  },
  mapGradient: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 1,
  },
  mapCard: {
    flex: 1,
    borderRadius: radius.xl - 1,
    overflow: 'hidden',
  },
  mapImage: {
    borderRadius: radius.xl - 1,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  statBlock: {
    gap: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statValueBig: {
    color: colors.emerald,
    fontSize: 22,
    fontFamily: fonts.black,
  },
  statValueUnit: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 3,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.cardBorder,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  locationValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cyan,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
  },
  primaryButtonText: {
    color: colors.deepBlack,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
});
