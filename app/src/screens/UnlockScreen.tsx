import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Screen } from '../components/Screen';
import { useAuth } from '../state/AuthContext';

export function UnlockScreen() {
  const { unlockWithBiometrics, logout } = useAuth();
  const [error, setError] = React.useState('');

  const handleUnlock = async () => {
    setError('');
    const ok = await unlockWithBiometrics();
    if (!ok) setError('Fingerprint not recognized. Try again.');
  };

  React.useEffect(() => {
    handleUnlock();
  }, []);

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.iconFrame}>
          <Ionicons name="lock-closed" size={44} color={colors.cyan} />
        </View>
        <Text style={styles.title}>Guardian Drive Locked</Text>
        <Text style={styles.subtitle}>Use your fingerprint to unlock.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleUnlock}>
          <Ionicons name="finger-print-outline" size={18} color={colors.deepBlack} />
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={logout}>
          <Text style={styles.logoutButtonText}>Log out instead</Text>
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.black,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  errorText: {
    color: colors.redAlert,
    fontSize: 12,
    fontFamily: fonts.medium,
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
  logoutButton: {
    paddingVertical: spacing.sm,
  },
  logoutButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
