import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../state/AuthContext';

export function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const justSignedUp = Boolean((route.params as { justSignedUp?: boolean } | undefined)?.justSignedUp);
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showInviteCode, setShowInviteCode] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    const trimmedCode = inviteCode.trim();
    try {
      const { inviteError } = await login(email.trim(), password, trimmedCode || undefined);
      // The screen unmounts immediately on success (phase change), so an
      // inline message wouldn't be visible — use a native Alert instead.
      if (trimmedCode) {
        if (inviteError) {
          Alert.alert('Invite Code Issue', inviteError);
        } else {
          Alert.alert('Joined as Driver', "You've been added as a driver for this vehicle.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Welcome Back" subtitle="Log in to keep watching over your vehicle." />

      <View style={styles.form}>
        {justSignedUp ? (
          <Text style={styles.successText}>Account created — log in to continue.</Text>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!busy}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!busy}
          />
        </View>

        {showInviteCode ? (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Invite Code</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="e.g. USX5B75H"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              editable={!busy}
            />
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.7} disabled={busy} onPress={() => setShowInviteCode(true)}>
            <Text style={styles.linkText}>Have an invite code from another driver?</Text>
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleLogin}
        >
          {busy ? (
            <ActivityIndicator color={colors.deepBlack} />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={18} color={colors.deepBlack} />
              <Text style={styles.primaryButtonText}>Log In</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          activeOpacity={0.7}
          disabled={busy}
          onPress={() => navigation.navigate('SignUp' as never)}
        >
          <Text style={styles.linkText}>
            Don&apos;t have an account? <Text style={styles.linkTextBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  successText: {
    color: colors.emerald,
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  input: {
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
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
    marginTop: spacing.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: colors.deepBlack,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  linkTextBold: {
    color: colors.cyan,
    fontFamily: fonts.bold,
  },
});
