import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import GlassButton from '@/components/glass/GlassButton';
import GlassInput from '@/components/glass/GlassInput';
import authService from '@/services/auth.service';
import { GlassTheme, useGlass } from '@/theme/glass';
import { getPasswordError, PASSWORD_HINT } from '@/utils/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();

  const [token, setToken] = useState(tokenParam ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [tokenParam]);

  async function handleSubmit() {
    if (!token.trim()) {
      Alert.alert('Validation', 'Please enter or paste the reset code from your email.');
      return;
    }
    const passwordError = getPasswordError(password);
    if (passwordError) {
      Alert.alert('Validation', passwordError);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), password);

      Alert.alert('Password Reset', 'Your password has been changed successfully. Please log in.', [
        { text: 'Log In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Reset Failed',
        error?.response?.data?.message ?? 'This reset code is invalid or has expired.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Reset Password"
      subtitle="Enter the code from your reset email and choose a new password."
      footer={
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkText}>Back to Login</Text>
        </Pressable>
      }
    >
      <GlassInput
        icon="key-outline"
        placeholder="Reset code"
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />

      <GlassInput
        icon="lock-outline"
        placeholder="New password"
        isPassword
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.hint}>{PASSWORD_HINT}</Text>

      <GlassInput
        icon="lock-check-outline"
        placeholder="Confirm new password"
        isPassword
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <GlassButton title="Reset Password" loading={loading} onPress={handleSubmit} />
    </AuthScreenLayout>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    hint: {
      fontSize: 12,
      color: g.textSecondary,
      marginTop: -4,
      marginBottom: 2,
    },
    linkText: {
      color: g.accent,
      fontWeight: '700',
      fontSize: 14.5,
    },
  });
}
