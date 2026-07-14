import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  cancelDriverInvite,
  DriverSummary,
  fetchDrivers,
  inviteDriver,
  PendingInviteSummary,
  removeDriver,
} from '../api/client';
import { colors, fonts, radius, spacing } from '../../theme/tokens';
import { Card, SectionLabel } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../state/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function relativeDate(ms: number): string {
  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function DriversScreen() {
  const { user } = useAuth();
  const [drivers, setDrivers] = React.useState<DriverSummary[]>([]);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInviteSummary[]>([]);
  const [maxDrivers, setMaxDrivers] = React.useState(5);
  const [loading, setLoading] = React.useState(true);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [inviteError, setInviteError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const res = await fetchDrivers();
      setDrivers(res.drivers);
      setPendingInvites(res.pendingInvites);
      setMaxDrivers(res.maxDrivers);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalSlotsUsed = drivers.length + pendingInvites.length;
  const atCap = totalSlotsUsed >= maxDrivers;
  const emailValid = EMAIL_PATTERN.test(email.trim());

  const openInviteModal = () => {
    setEmail('');
    setInviteError('');
    setModalVisible(true);
  };

  const handleInvite = async () => {
    if (!emailValid || inviteBusy) return;
    setInviteBusy(true);
    setInviteError('');
    try {
      await inviteDriver(email.trim());
      setModalVisible(false);
      await load();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Failed to send invite');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRemoveDriver = (driver: DriverSummary) => {
    const isSelf = driver.id === user?.id;
    Alert.alert(
      isSelf ? 'Leave as a Driver?' : `Remove ${driver.name}?`,
      isSelf
        ? "You'll lose driver access to this vehicle."
        : `${driver.name} will lose driver access to this vehicle.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSelf ? 'Leave' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeDriver(driver.id);
            await load();
          },
        },
      ],
    );
  };

  const handleCancelInvite = (invite: PendingInviteSummary) => {
    Alert.alert('Cancel Invite?', `The invite sent to ${invite.email} will no longer work.`, [
      { text: 'Keep It', style: 'cancel' },
      {
        text: 'Cancel Invite',
        style: 'destructive',
        onPress: async () => {
          await cancelDriverInvite(invite.id);
          await load();
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Drivers" subtitle={`${totalSlotsUsed} of ${maxDrivers} driver slots used`} />

      {loading ? (
        <ActivityIndicator color={colors.cyan} style={styles.loader} />
      ) : (
        <>
          <SectionLabel>Drivers</SectionLabel>
          <Card style={styles.listCard}>
            {drivers.map((driver, index) => (
              <View key={driver.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <View style={styles.rowIconFrame}>
                    <Ionicons name="person" size={18} color={colors.cyan} />
                  </View>
                  <View style={styles.rowTextBlock}>
                    <Text style={styles.rowLabel}>
                      {driver.name}
                      {driver.id === user?.id ? ' (You)' : ''}
                    </Text>
                    <Text style={styles.rowSubtitle}>{driver.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    activeOpacity={0.7}
                    onPress={() => handleRemoveDriver(driver)}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.redAlert} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>

          {pendingInvites.length > 0 ? (
            <>
              <SectionLabel>Pending Invites</SectionLabel>
              <Card style={styles.listCard}>
                {pendingInvites.map((invite, index) => (
                  <View key={invite.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.row}>
                      <View style={[styles.rowIconFrame, styles.rowIconFramePending]}>
                        <Ionicons name="mail-outline" size={18} color={colors.amberWarn} />
                      </View>
                      <View style={styles.rowTextBlock}>
                        <Text style={styles.rowLabel}>{invite.email}</Text>
                        <Text style={styles.rowSubtitle}>Sent {relativeDate(invite.createdAt)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        activeOpacity={0.7}
                        onPress={() => handleCancelInvite(invite)}
                      >
                        <Ionicons name="close-circle-outline" size={20} color={colors.redAlert} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.inviteButton, atCap && styles.inviteButtonDisabled]}
            activeOpacity={0.85}
            disabled={atCap}
            onPress={openInviteModal}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.deepBlack} />
            <Text style={styles.inviteButtonText}>{atCap ? 'Driver Limit Reached' : 'Invite Driver'}</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconFrame}>
              <Ionicons name="person-add" size={28} color={colors.cyan} />
            </View>
            <Text style={styles.modalTitle}>Invite Driver</Text>
            <Text style={styles.modalSubtitle}>
              They&apos;ll get an email with an invite code. After they create an account and log in,
              entering the code adds them as a driver.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="driver@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!inviteBusy}
              />
            </View>

            {inviteError ? <Text style={styles.errorText}>{inviteError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                disabled={inviteBusy}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, (!emailValid || inviteBusy) && styles.inviteButtonDisabled]}
                activeOpacity={0.85}
                disabled={!emailValid || inviteBusy}
                onPress={handleInvite}
              >
                {inviteBusy ? <ActivityIndicator color={colors.deepBlack} /> : <Text style={styles.sendButtonText}>Send Invite</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xl,
  },
  listCard: {
    padding: spacing.sm,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowIconFrame: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.cyanSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconFramePending: {
    backgroundColor: colors.amberSoft,
  },
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  removeButton: {
    padding: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cyan,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.md,
  },
  inviteButtonDisabled: {
    opacity: 0.4,
  },
  inviteButtonText: {
    color: colors.deepBlack,
    fontSize: 15,
    fontFamily: fonts.bold,
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
});
