import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
import authService from '@/services/auth.service';
import { authStyles } from './_authStyles';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Validation', 'Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(trimmedEmail);

      // The backend never reveals whether the email exists (avoids
      // account enumeration), so this same message shows regardless.
      setSent(true);
    } catch (error: any) {
      Alert.alert(
        'Something Went Wrong',
        error?.response?.data?.message ?? 'Unable to process your request right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Forgot Password"
      subtitle={
        sent
          ? "If an account exists for that email, we've sent a reset link. Open it on this device and copy the code from the link."
          : "Enter your account email and we'll send you a reset link."
      }
      footer={
        <>
          {sent && (
            <Pressable
              onPress={() => router.push('/(auth)/reset-password')}
              style={{ marginBottom: 16 }}
            >
              <Text style={authStyles.linkStandalone}>I Have a Reset Code</Text>
            </Pressable>
          )}
          <Text style={authStyles.bottomText}>Remembered your password?</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={authStyles.link}>Login</Text>
          </Pressable>
        </>
      }
    >
      {!sent && (
        <>
          <AppInput
            placeholder="Email Address"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <PrimaryButton title="Send Reset Link" loading={loading} onPress={handleSubmit} />
        </>
      )}
    </AuthScreenLayout>
  );
}
