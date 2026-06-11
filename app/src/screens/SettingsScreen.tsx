import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.logoFrame}>
          <Image source={require('../../theme/assets/brand-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.item}>Privacy</Text>
        <Text style={styles.item}>Emergency Contacts</Text>
        <Text style={styles.item}>Notification Preferences</Text>
        <Text style={styles.item}>Biometric Confirmation</Text>
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
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  item: {
    color: colors.textPrimary,
    fontSize: 14,
  },
});
