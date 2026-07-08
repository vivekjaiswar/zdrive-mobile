import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
import authService from '@/services/auth.service';
import { authStyles } from './_authStyles';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(emailParam ?? '');
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    if (!token.trim()) {
      Alert.alert('Validation', 'Paste the verification code from your email.');
      return;
    }

    try {
      setVerifying(true);
      await authService.verifyEmail(token.trim());

      Alert.alert('Verified', 'Your email has been verified. You can log in now.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message ?? 'This code is invalid or has expired.',
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      Alert.alert('Validation', 'Enter your email to resend the verification link.');
      return;
    }

    try {
      setResending(true);
      const response = await authService.resendVerification(email.trim());
      Alert.alert('Email Sent', response.message ?? 'Check your inbox for a new link.');
    } catch (error: any) {
      Alert.alert(
        'Unable to Resend',
        error?.response?.data?.message ?? 'Something went wrong.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Verify Your Email"
      subtitle={
        'We emailed you a verification link. Open it on this device and copy the ' +
        'code from the link (the part after "token="), then paste it below.'
      }
      footer={
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={authStyles.linkStandalone}>Back to Login</Text>
        </Pressable>
      }
    >
      <AppInput
        placeholder="Verification Code"
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />

      <PrimaryButton title="Verify Email" loading={verifying} onPress={handleVerify} />

      <AppInput
        placeholder="Email Address (to resend)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Pressable onPress={handleResend} disabled={resending}>
        <Text style={authStyles.linkStandalone}>
          {resending ? 'Sending...' : 'Resend Verification Email'}
        </Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
