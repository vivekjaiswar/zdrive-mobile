import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
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
import TextPromptModal from '@/components/common/TextPromptModal';
import usersService from '@/services/users.service';
import billingService, { SubscriptionDetails } from '@/services/billing.service';
import biometricService from '@/services/biometric.service';
import backupService from '@/services/backup.service';
import { useAuthStore } from '@/store/auth.store';
import { useSecurityStore } from '@/store/security.store';
import { useBackupStore } from '@/store/backup.store';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScroll';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { UserProfile } from '@/types/user';

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

  const biometricAvailable = useSecurityStore((state) => state.biometricAvailable);
  const biometricEnabled = useSecurityStore((state) => state.biometricEnabled);
  const setBiometricEnabled = useSecurityStore((state) => state.setBiometricEnabled);

  const autoBackupEnabled = useBackupStore((state) => state.autoBackupEnabled);
  const setAutoBackupEnabled = useBackupStore((state) => state.setAutoBackupEnabled);

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
      const [data, sub] = await Promise.all([
        usersService.getProfile(),
        billingService.getSubscription().catch(() => null),
      ]);
      setProfile(data);
      setSubDetails(sub);
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
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });

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
        </View>

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
            value="Manage in Settings"
            onPress={() => Linking.openSettings()}
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

        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="shield-check-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
          <SettingsRow
            icon="file-document-outline"
            label="Terms of Service"
            onPress={() => router.push('/legal/terms')}
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
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    sectionLabel: {
      marginTop: 8,
      marginBottom: 8,
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
