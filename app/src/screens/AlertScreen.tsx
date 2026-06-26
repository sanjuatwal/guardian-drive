import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { confirmAlert, dismissAlert } from '../api/client';
import { colors, fonts, gradients, motion, radius, spacing } from '../../theme/tokens';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState } from '../state/AppStateContext';
import { useAuth } from '../state/AuthContext';

const fallbackReasons = [
  'Movement while parked',
  'Key tag not nearby',
  'System escalated to critical alert',
];

export function AlertScreen() {
  const navigation = useNavigation();
  const { state, refresh } = useAppState();
  const { confirmWithBiometrics } = useAuth();
  const [busy, setBusy] = useState(false);
  const alert = state.currentAlert;
  const reasons = alert?.reasons.length ? alert.reasons : fallbackReasons;

  const resolve = async (action: 'confirm' | 'dismiss') => {
    if (busy) return;
    setBusy(true);
    try {
      if (alert?.id) {
        if (action === 'confirm') {
          const verified = await confirmWithBiometrics('Confirm this is a real theft');
          if (!verified) return;
          await confirmAlert(alert.id);
        } else {
          await dismissAlert(alert.id);
        }
        await refresh();
      }
      // AlertWatcher closes the modal once the alert clears from state, but
      // fall back to manual dismiss when running on mock data.
      if (!alert?.id && navigation.canGoBack()) {
        navigation.goBack();
      }
    } finally {
      setBusy(false);
    }
  };

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: motion.alertPulseMs / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: motion.alertPulseMs / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.08] });

  return (
    <Screen>
      <ScreenHeader />

      <View style={styles.body}>
        <View style={styles.iconStack}>
          <Animated.View
            style={[styles.pulseRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <View style={styles.iconFrame}>
            <Ionicons name="warning" size={44} color={colors.redAlert} />
          </View>
        </View>

        <Text style={styles.title}>{alert?.title ?? 'Possible Vehicle Theft'}</Text>
        <Text style={styles.subtitle}>
          We&apos;ve detected unusual activity that suggests your vehicle may be at risk.
        </Text>

        <LinearGradient
          colors={gradients.dangerGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.reasonGradient}
        >
          <View style={styles.reasonCard}>
            <Text style={styles.reasonHeading}>Why this alert?</Text>
            {reasons.map((reason) => (
              <View key={reason} style={styles.reasonRow}>
                <View style={styles.reasonIconFrame}>
                  <Ionicons name="alert-circle" size={15} color={colors.redAlert} />
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, busy && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={() => resolve('confirm')}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.primaryText}>{busy ? 'Working…' : 'Confirm Theft'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, busy && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={() => resolve('dismiss')}
        >
          <Text style={styles.secondaryText}>It&apos;s Me — False Alarm</Text>
        </TouchableOpacity>

        <Text style={styles.autoConfirmText}>Alert will auto-confirm in 30s</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconStack: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.redAlert,
  },
  iconFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.graphite,
    borderColor: colors.redBorder,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.redAlert,
    fontSize: 26,
    fontFamily: fonts.black,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  reasonGradient: {
    alignSelf: 'stretch',
    borderRadius: radius.lg,
    padding: 1,
  },
  reasonCard: {
    backgroundColor: colors.graphite,
    borderRadius: radius.lg - 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  reasonHeading: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reasonIconFrame: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.medium,
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.redAlert,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
  autoConfirmText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});
