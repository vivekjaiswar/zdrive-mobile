import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
import authService from '@/services/auth.service';
import { authStyles } from '@/components/auth/authStyles';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!token.trim()) {
      Alert.alert('Validation', 'Paste the reset code from your email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), password);

      Alert.alert('Password Reset', 'Your password has been changed. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Reset Failed',
        error?.response?.data?.message ?? 'This code is invalid or has expired.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Reset Password"
      subtitle="Paste the code from your reset email and choose a new password."
      footer={
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={authStyles.linkStandalone}>Back to Login</Text>
        </Pressable>
      }
    >
      <AppInput
        placeholder="Reset Code"
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />
      <AppInput
        placeholder="New Password (min. 8 characters)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <AppInput
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <PrimaryButton title="Reset Password" loading={loading} onPress={handleSubmit} />
    </AuthScreenLayout>
  );
}
