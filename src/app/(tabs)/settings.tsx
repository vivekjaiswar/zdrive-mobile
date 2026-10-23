import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Sentry from '@sentry/react-native';

import Screen from '@/components/Layout/Screen';
import SettingsSkeleton from '@/components/settings/SettingsSkeleton';
import ProfileHeader from '@/components/settings/ProfileHeader';
import SettingsRow from '@/components/settings/SettingsRow';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import DeleteAccountModal from '@/components/settings/DeleteAccountModal';
import PlansModal from '@/components/settings/PlansModal';
import TwoFactorModal from '@/components/settings/TwoFactorModal';
import PermissionsModal from '@/components/settings/PermissionsModal';
import PaymentsHistoryModal from '@/components/settings/PaymentsHistoryModal';
import BillingDetailsModal from '@/components/settings/BillingDetailsModal';
import TextPromptModal from '@/components/common/TextPromptModal';
import usersService from '@/services/users.service';
import billingService, { SubscriptionDetails } from '@/services/billing.service';
import authService from '@/services/auth.service';
import biometricService from '@/services/biometric.service';
import backupService from '@/services/backup.service';
import { useAuthStore } from '@/store/auth.store';
import { useSecurityStore, runWithPickerBypass } from '@/store/security.store';
import { useBackupStore } from '@/store/backup.store';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScroll';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { UserProfile, UserReferralInfo } from '@/types/user';

function formatBytes(value: string) {
  const bytes = Number(value) || 0;
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);
  const tabBarHeight = useTabBarHeight();
  const onScroll = useTabBarScrollHandler();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const biometricAvailable = useSecurityStore((state) => state.biometricAvailable);
  const biometricEnabled = useSecurityStore((state) => state.biometricEnabled);
  const setBiometricEnabled = useSecurityStore((state) => state.setBiometricEnabled);

  const autoBackupEnabled = useBackupStore((state) => state.autoBackupEnabled);
  const setAutoBackupEnabled = useBackupStore((state) => state.setAutoBackupEnabled);

  const [referralInfo, setReferralInfo] = useState<UserReferralInfo | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [plansVisible, setPlansVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [twoFactorModalVisible, setTwoFactorModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [paymentsModalVisible, setPaymentsModalVisible] = useState(false);
  const [billingDetailsModalVisible, setBillingDetailsModalVisible] = useState(false);
  const [savingBillingDetails, setSavingBillingDetails] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [approvingDevice, setApprovingDevice] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backedUpCount, setBackedUpCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      backupService.backedUpCount().then(setBackedUpCount).catch(() => {});
    }, []),
  );

  async function loadProfile() {
    try {
      const [data, sub, ref] = await Promise.all([
        usersService.getProfile(),
        billingService.getSubscription().catch(() => null),
        usersService.getReferralInfo().catch(() => null),
      ]);
      setProfile(data);
      setSubDetails(sub);
      setReferralInfo(ref);
    } catch (e: any) {
      console.error('Failed to load profile:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAutoBackup(enabled: boolean) {
    if (enabled) {
      const perm = await backupService.requestPermission();
      if (!perm.granted) {
        Alert.alert(
          'Permission Needed',
          'Photo Library permission is required to enable auto photo backup. Tap Open Settings to grant access.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      await setAutoBackupEnabled(true);
      await backupService.registerBackgroundTask();
      Alert.alert('Auto Backup Enabled', 'ZDrive will now back up new photos in the background.');
    } else {
      await setAutoBackupEnabled(false);
      await backupService.unregisterBackgroundTask();
    }
  }

  async function handleSyncNow() {
    try {
      setBackingUp(true);
      const result = await backupService.run(() => {});
      const count = await backupService.backedUpCount();
      setBackedUpCount(count);
      if (result === 'complete') {
        Alert.alert('Sync Complete', 'All photos on your device are backed up to ZDrive.');
      }
    } catch {
      Alert.alert('Sync Failed', 'Could not sync photos. Check your connection.');
    } finally {
      setBackingUp(false);
    }
  }

  async function handleChangeAvatar() {
    const result = await runWithPickerBypass(() =>
      DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      }),
    );

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    try {
      setUploadingAvatar(true);
      await usersService.uploadAvatar(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'image/jpeg',
      );
      await loadProfile();
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error?.response?.data?.message ?? 'Unable to update your avatar.',
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveName(name: string) {
    if (!name) {
      setNameModalVisible(false);
      return;
    }

    try {
      setSavingName(true);
      await usersService.updateProfile(name);
      setProfile((prev) => (prev ? { ...prev, name } : prev));
      setNameModalVisible(false);
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error?.response?.data?.message ?? 'Unable to update your name.',
      );
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveBillingDetails(gstin: string, billingState: string) {
    try {
      setSavingBillingDetails(true);
      await usersService.updateProfile({
        gstin: gstin || undefined,
        billingState: billingState || undefined,
      });
      setBillingDetailsModalVisible(false);
      await loadProfile();
      Alert.alert('Updated', 'Your billing details have been saved.');
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error?.response?.data?.message ?? 'Unable to update billing details.',
      );
    } finally {
      setSavingBillingDetails(false);
    }
  }

  async function handleApproveDevice(userCode: string) {
    if (!userCode.trim()) return;
    try {
      setApprovingDevice(true);
      await authService.approveDevice(userCode.trim().toUpperCase());
      setDeviceModalVisible(false);
      Alert.alert('Success', 'Desktop application approved successfully!');
    } catch (error: any) {
      Alert.alert(
        'Approval Failed',
        error?.response?.data?.message ?? 'Invalid or expired code.',
      );
    } finally {
      setApprovingDevice(false);
    }
  }

  async function handleChangePassword(currentPassword: string, newPassword: string) {
    try {
      setChangingPassword(true);
      await usersService.changePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      Alert.alert('Success', 'Your password has been updated.');
    } catch (error: any) {
      Alert.alert(
        'Change Password Failed',
        error?.response?.data?.message ?? 'Unable to change your password.',
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (biometricAvailable) {
      const reauthed = await biometricService.authenticate();
      if (!reauthed) return;
    }

    try {
      setDeletingAccount(true);
      await usersService.deleteAccount();
      setDeleteModalVisible(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert(
        'Delete Failed',
        error?.response?.data?.message ?? 'Unable to delete your account.',
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleTwoFactorDisabledLoggedOut() {
    setTwoFactorModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  }

  function handleLogout() {
    Alert.alert('Log Out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (loading || !profile) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <SettingsSkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      >
        <ProfileHeader
          name={profile.name}
          email={profile.email}
          avatarUrl={profile.avatarUrl}
          uploadingAvatar={uploadingAvatar}
          onChangeAvatar={handleChangeAvatar}
          onEditName={() => setNameModalVisible(true)}
        />

        <Text style={styles.sectionLabel}>Storage</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="database-outline"
            label="Used"
            value={`${formatBytes(profile.storageUsed)} of ${formatBytes(profile.storageLimit)}`}
            showChevron={false}
          />
        </View>

        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="crown-outline"
            label="Current Plan"
            value={profile.plan}
            onPress={() => setPlansVisible(true)}
          />
          <SettingsRow
            icon="calendar-check-outline"
            label="Status"
            value={profile.subscriptionStatus}
            showChevron={false}
          />
          {subDetails?.subscriptionExpiresAt && (
            <SettingsRow
              icon="clock-outline"
              label="Expires In"
              value={
                (() => {
                  const days = Math.ceil(
                    (new Date(subDetails.subscriptionExpiresAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return days > 0 ? `${days} days left` : 'Expired';
                })()
              }
              showChevron={false}
            />
          )}
          <SettingsRow
            icon="receipt-text-outline"
            label="Payment History"
            onPress={() => setPaymentsModalVisible(true)}
          />
          <SettingsRow
            icon="card-account-details-outline"
            label="Tax & Billing Details"
            value={profile.gstin ? 'Configured' : 'Not set'}
            onPress={() => setBillingDetailsModalVisible(true)}
          />
        </View>

        {referralInfo && (
          <>
            <Text style={styles.sectionLabel}>Referrals & Rewards</Text>
            <View style={styles.card}>
              <SettingsRow
                icon="gift-outline"
                label="Referral Code"
                value={referralInfo.referralCode}
                onPress={() => {
                  Share.share({
                    message: `Join OJI Drive with my referral link and get 2 GB bonus cloud storage! ${referralInfo.referralUrl}`,
                  });
                }}
              />
              <SettingsRow
                icon="account-multiple-plus-outline"
                label="Friends Referred"
                value={`${referralInfo.referredCount} (Bonus: ${formatBytes(referralInfo.bonusStorageBytes)})`}
                showChevron={false}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Photo Backup & Permissions</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="cloud-sync-outline"
            label="Auto Photo Backup"
            toggleValue={autoBackupEnabled}
            onToggleChange={handleToggleAutoBackup}
          />
          <SettingsRow
            icon="image-multiple-outline"
            label="Photos Backed Up"
            value={`${backedUpCount} photos`}
            onPress={handleSyncNow}
            loading={backingUp}
          />
          <SettingsRow
            icon="cog-outline"
            label="System Permissions"
            value="Gallery, Files, Camera"
            onPress={() => setPermissionsModalVisible(true)}
          />
        </View>

        <Text style={styles.sectionLabel}>Security</Text>
        <View style={styles.card}>
          {biometricAvailable && (
            <SettingsRow
              icon="fingerprint"
              label="Unlock with Face ID / Fingerprint"
              toggleValue={biometricEnabled}
              onToggleChange={setBiometricEnabled}
            />
          )}
          <SettingsRow
            icon="shield-key-outline"
            label="Two-Factor Authentication"
            value={profile.twoFactorEnabled ? 'On' : 'Off'}
            onPress={() => setTwoFactorModalVisible(true)}
          />
          <SettingsRow
            icon="devices"
            label="Active Sessions"
            onPress={() => router.push('/sessions')}
          />
          <SettingsRow
            icon="monitor-cellphone"
            label="Link Desktop App"
            onPress={() => setDeviceModalVisible(true)}
          />
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="lock-outline"
            label="Change Password"
            onPress={() => setPasswordModalVisible(true)}
          />
          <SettingsRow
            icon="logout"
            label="Log Out"
            destructive
            showChevron={false}
            onPress={handleLogout}
          />
          <SettingsRow
            icon="delete-outline"
            label="Delete Account"
            destructive
            showChevron={false}
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>

        {isAdmin && (
          <>
            <Text style={styles.sectionLabel}>Developer & Admin</Text>
            <View style={styles.card}>
              <SettingsRow
                icon="shield-crown-outline"
                label="Admin & Release Console"
                value="v1.9.4"
                onPress={() => router.push('/admin' as any)}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Legal & Compliance</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="file-document-outline"
            label="Terms of Service"
            onPress={() => router.push('/legal/terms')}
          />
          <SettingsRow
            icon="shield-lock-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
          <SettingsRow
            icon="security"
            label="Security Policy"
            onPress={() => router.push('/legal/security')}
          />
        </View>
      </ScrollView>

      <TextPromptModal
        visible={nameModalVisible}
        title="Edit Name"
        initialValue={profile.name ?? ''}
        placeholder="Your name"
        confirmLabel="Save"
        loading={savingName}
        onCancel={() => setNameModalVisible(false)}
        onConfirm={handleSaveName}
      />

      <ChangePasswordModal
        visible={passwordModalVisible}
        loading={changingPassword}
        onCancel={() => setPasswordModalVisible(false)}
        onSubmit={handleChangePassword}
      />

      <PlansModal
        visible={plansVisible}
        currentPlan={profile.plan}
        userEmail={profile.email}
        onClose={() => setPlansVisible(false)}
        onUpgraded={loadProfile}
      />

      <PermissionsModal
        visible={permissionsModalVisible}
        onClose={() => setPermissionsModalVisible(false)}
      />

      <DeleteAccountModal
        visible={deleteModalVisible}
        loading={deletingAccount}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
      />

      <TwoFactorModal
        visible={twoFactorModalVisible}
        enabled={profile.twoFactorEnabled}
        onChanged={loadProfile}
        onDisabledLoggedOut={handleTwoFactorDisabledLoggedOut}
        onClose={() => setTwoFactorModalVisible(false)}
      />

      <PaymentsHistoryModal
        visible={paymentsModalVisible}
        onClose={() => setPaymentsModalVisible(false)}
      />

      <BillingDetailsModal
        visible={billingDetailsModalVisible}
        loading={savingBillingDetails}
        initialGstin={profile.gstin}
        initialBillingState={profile.billingState}
        onCancel={() => setBillingDetailsModalVisible(false)}
        onSubmit={handleSaveBillingDetails}
      />

      <TextPromptModal
        visible={deviceModalVisible}
        title="Link Desktop App"
        placeholder="Enter 8-character code (e.g. ABCD-1234)"
        confirmLabel="Approve"
        loading={approvingDevice}
        onCancel={() => setDeviceModalVisible(false)}
        onConfirm={handleApproveDevice}
      />
    </Screen>
  );
}

import { fonts } from '@/theme/typography';

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sectionLabel: {
      marginTop: 8,
      marginBottom: 8,
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingHorizontal: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
