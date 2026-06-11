import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Easing, Image } from 'react-native';

import { colors, radius, spacing, motion } from '../../theme/tokens';

export function AlertScreen() {
  const pulseAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: motion.alertPulseMs / 2,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: motion.alertPulseMs / 2,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0.9, 1],
    outputRange: [1, 1.02],
  });
  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.logoFrame}>
          <Image source={require('../../theme/assets/brand-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </View>
      </View>

      {/* Danger Pulse Glow Background */}
      <Animated.View
        style={[
          styles.dangerGlowPulse,
          { transform: [{ scale: pulseScale }] },
        ]}
      />

      {/* Alert Card with Red Glow */}
      <Animated.View
        style={[
          styles.alertCard,
          { transform: [{ scale: pulseScale }] },
        ]}
      >
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <Text style={styles.alertTitle}>Possible Vehicle Theft</Text>
        </View>
        <Text style={styles.alertBody}>Unusual movement detected. Ignition activity does not match an authorized session.</Text>
        <View style={styles.reasonList}>
          <Text style={styles.reasonItem}>• Movement while parked</Text>
          <Text style={styles.reasonItem}>• Key tag not nearby</Text>
          <Text style={styles.reasonItem}>• System escalated to critical alert</Text>
        </View>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>Automatic response in:</Text>
          <Text style={styles.countdownValue}>0:45</Text>
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
        <Text style={styles.primaryIcon}>✓</Text>
        <Text style={styles.primaryText}>Confirm Theft</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
        <Text style={styles.secondaryText}>It's Me — False Alarm</Text>
      </TouchableOpacity>
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
    marginTop: spacing.sm,
  },
  logoFrame: {
    width: 220,
    height: 48,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  dangerGlowPulse: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.redAlert,
    opacity: 0.08,
    marginLeft: -150,
    marginTop: -150,
  },
  alertCard: {
    backgroundColor: colors.graphite,
    borderColor: colors.redAlert,
    borderWidth: 2,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    zIndex: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 32,
  },
  alertTitle: {
    color: colors.redAlert,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  alertBody: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonItem: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  countdownContainer: {
    backgroundColor: colors.carbon,
    borderColor: colors.redAlert,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  countdownValue: {
    color: colors.redAlert,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryButton: {
    backgroundColor: colors.redAlert,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexDirection: 'row',
    zIndex: 10,
  },
  primaryIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.carbon,
    zIndex: 10,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
