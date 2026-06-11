import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export function RecoveryScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.logoFrame}>
          <Image source={require('../../theme/assets/brand-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>
      <Text style={styles.title}>Live Recovery</Text>
      <View style={styles.mapCard}>
        <Text style={styles.placeholder}>Live map and route trail placeholder</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>Speed 68 km/h</Text>
        <Text style={styles.metaChip}>Last update 10:24 PM</Text>
        <Text style={styles.metaChip}>Live</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.deepBlack,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    alignItems: 'flex-start',
  },
  logoFrame: {
    width: 220,
    height: 48,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
  },
  mapCard: {
    flex: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    color: colors.textPrimary,
    backgroundColor: colors.carbon,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
