import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../state/AuthContext';

export function SignUpScreen() {
  const navigation = useNavigation();
  const { signup } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8 && !busy;

  const handleSignUp = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await signup(name.trim(), email.trim(), password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation.navigate as any)('Login', { justSignedUp: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Create Account" subtitle="Protect your vehicle with Guardian Drive." />

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Jane Doe"
            placeholderTextColor={colors.textMuted}
            editable={!busy}
          />
        </View>

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
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            editable={!busy}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleSignUp}
        >
          {busy ? (
            <ActivityIndicator color={colors.deepBlack} />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color={colors.deepBlack} />
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          activeOpacity={0.7}
          disabled={busy}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
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
