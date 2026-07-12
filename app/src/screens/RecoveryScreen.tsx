import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { markVehicleRecovered, sendPolicePack } from '../api/client';
import { colors, fonts, gradients, radius, spacing } from '../../theme/tokens';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState, useDeviceSummary } from '../state/AppStateContext';
import { useAuth } from '../state/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LiveBadge() {
  return (
    <View style={styles.liveBadge}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

type SendState = 'idle' | 'sending' | 'sent' | 'error';

export function RecoveryScreen() {
  const device = useDeviceSummary();
  const { state, refresh } = useAppState();
  const { confirmWithBiometrics } = useAuth();
  const alertId = state.latestConfirmedAlertId;
  const inRecovery = device.status === 'recovery';

  const [modalVisible, setModalVisible] = React.useState(false);
  const [recipientName, setRecipientName] = React.useState('');
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [sendState, setSendState] = React.useState<SendState>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [recovering, setRecovering] = React.useState(false);

  const emailValid = EMAIL_PATTERN.test(recipientEmail.trim());
  const canSubmit = recipientName.trim().length > 0 && emailValid && sendState !== 'sending';

  const openModal = () => {
    setSendState('idle');
    setErrorMessage('');
    setModalVisible(true);
  };

  const closeModal = () => {
    if (sendState === 'sending') return;
    setModalVisible(false);
  };

  const handleSend = async () => {
    if (!canSubmit || !alertId) return;
    const verified = await confirmWithBiometrics('Confirm sending the Police Pack');
    if (!verified) return;
    setSendState('sending');
    setErrorMessage('');
    try {
      await sendPolicePack(alertId, recipientName.trim(), recipientEmail.trim());
      setSendState('sent');
    } catch (e) {
      setSendState('error');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to send. Try again.');
    }
  };

  const confirmVehicleRecovered = () => {
    if (!alertId || recovering) return;
    Alert.alert(
      'Mark Vehicle Recovered?',
      'This closes out the recovery and returns the vehicle to Protected. The incident report stays available, but Police Pack will no longer be offered for it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vehicle Recovered',
          style: 'destructive',
          onPress: async () => {
            setRecovering(true);
            try {
              await markVehicleRecovered(alertId);
              await refresh();
            } finally {
              setRecovering(false);
            }
          },
        },
      ],
    );
  };

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
        <TouchableOpacity
          style={[styles.primaryButton, !alertId && styles.primaryButtonDisabled]}
          activeOpacity={0.8}
          disabled={!alertId}
          onPress={openModal}
        >
          <Ionicons name="shield-half-outline" size={18} color={colors.deepBlack} />
          <Text style={styles.primaryButtonText}>Police Pack</Text>
        </TouchableOpacity>
      </View>

      {inRecovery ? (
        <TouchableOpacity
          style={styles.recoveredButton}
          activeOpacity={0.8}
          disabled={recovering}
          onPress={confirmVehicleRecovered}
        >
          {recovering ? (
            <ActivityIndicator color={colors.emerald} />
          ) : (
            <>
              <Ionicons name="checkmark-done-outline" size={16} color={colors.emerald} />
              <Text style={styles.recoveredButtonText}>Vehicle Recovered</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {sendState === 'sent' ? (
              <>
                <View style={styles.modalIconFrame}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.emerald} />
                </View>
                <Text style={styles.modalTitle}>Report Sent</Text>
                <Text style={styles.modalSubtitle}>
                  The incident report was emailed to {recipientEmail.trim()}.
                </Text>
                <TouchableOpacity style={styles.doneButton} activeOpacity={0.85} onPress={closeModal}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.modalIconFrame}>
                  <Ionicons name="shield-half-outline" size={28} color={colors.cyan} />
                </View>
                <Text style={styles.modalTitle}>Send Police Pack</Text>
                <Text style={styles.modalSubtitle}>
                  Generates a PDF of the full incident timeline and emails it directly to the
                  recipient. Only they receive it — it isn&apos;t stored or viewable in this app.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recipient name</Text>
                  <TextInput
                    style={styles.input}
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholder="Officer Jane Doe"
                    placeholderTextColor={colors.textMuted}
                    editable={sendState !== 'sending'}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Recipient email</Text>
                  <TextInput
                    style={styles.input}
                    value={recipientEmail}
                    onChangeText={setRecipientEmail}
                    placeholder="officer@policedept.gov"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={sendState !== 'sending'}
                  />
                </View>

                {sendState === 'error' ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                    disabled={sendState === 'sending'}
                    onPress={closeModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendButton, !canSubmit && styles.primaryButtonDisabled]}
                    activeOpacity={0.85}
                    disabled={!canSubmit}
                    onPress={handleSend}
                  >
                    {sendState === 'sending' ? (
                      <ActivityIndicator color={colors.deepBlack} />
                    ) : (
                      <Text style={styles.sendButtonText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  recoveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  recoveredButtonText: {
    color: colors.emerald,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.graphite,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  modalIconFrame: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.black,
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  input: {
    alignSelf: 'stretch',
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
    alignSelf: 'stretch',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  sendButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyan,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  sendButtonText: {
    color: colors.deepBlack,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  doneButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.carbon,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  doneButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
});
