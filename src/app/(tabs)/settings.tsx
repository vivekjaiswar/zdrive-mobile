import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';

import Screen from '@/components/Layout/Screen';
import ProfileHeader from '@/components/settings/ProfileHeader';
import SettingsRow from '@/components/settings/SettingsRow';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import DeleteAccountModal from '@/components/settings/DeleteAccountModal';
import PlansModal from '@/components/settings/PlansModal';
import TextPromptModal from '@/components/common/TextPromptModal';
import usersService from '@/services/users.service';
import { useAuthStore } from '@/store/auth.store';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
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
  const logout = useAuthStore((state) => state.logout);
  const setToken = useAuthStore((state) => state.setToken);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [plansVisible, setPlansVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  async function loadProfile() {
    try {
      const data = await usersService.getProfile();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      // The upload response's avatarUrl is a raw S3 key, not a
      // renderable URL - re-fetch the profile to get the resolved
      // pre-signed URL.
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
      const { accessToken } = await usersService.changePassword(
        currentPassword,
        newPassword,
      );

      // Server bumped tokenVersion as part of this change, so the
      // token we were using a second ago is now revoked. Persist and
      // re-attach the fresh one immediately, or the very next API
      // call (even just loading this screen) gets a 401 and silently
      // logs the user out right after they saw a "Success" alert.
      await SecureStore.setItemAsync('accessToken', accessToken);
      setToken(accessToken);

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
    try {
      setDeletingAccount(true);
      await usersService.deleteAccount();

      // Account is gone server-side - clear the local session
      // immediately rather than waiting for a 401 on some future
      // request, and don't leave the delete modal open underneath
      // the login screen.
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
        onClose={() => setPlansVisible(false)}
      />

      <DeleteAccountModal
        visible={deleteModalVisible}
        loading={deletingAccount}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
      />
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

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
