import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Screen } from '../components/Screen';
import { useAuth } from '../state/AuthContext';

export function EnableBiometricsScreen() {
  const { enableBiometrics, skipBiometrics } = useAuth();
  const [error, setError] = React.useState('');

  const handleEnable = async () => {
    setError('');
    const ok = await enableBiometrics();
    if (!ok) setError('Could not verify fingerprint. Try again or skip for now.');
  };

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.iconFrame}>
          <Ionicons name="finger-print" size={48} color={colors.cyan} />
        </View>
        <Text style={styles.title}>Enable Fingerprint Unlock</Text>
        <Text style={styles.subtitle}>
          Use your fingerprint to unlock Guardian Drive instead of your password, and to confirm
          sensitive actions like Confirm Theft, Trigger Siren, and Police Pack.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleEnable}>
          <Ionicons name="finger-print-outline" size={18} color={colors.deepBlack} />
          <Text style={styles.primaryButtonText}>Enable Fingerprint</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} activeOpacity={0.7} onPress={skipBiometrics}>
          <Text style={styles.skipButtonText}>Not Now</Text>
        </TouchableOpacity>
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
  iconFrame: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.black,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    color: colors.redAlert,
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cyan,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: colors.deepBlack,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  skipButton: {
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
