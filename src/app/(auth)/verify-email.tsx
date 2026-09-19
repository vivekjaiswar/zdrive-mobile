import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import GlassButton from '@/components/glass/GlassButton';
import GlassInput from '@/components/glass/GlassInput';
import authService from '@/services/auth.service';
import { GlassTheme, useGlass } from '@/theme/glass';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const { email: emailParam, token: tokenParam } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();

  const [email, setEmail] = useState(emailParam ?? '');
  const [token, setToken] = useState(tokenParam ?? '');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Auto-verify if opened via deep link with ?token=xyz
  useEffect(() => {
    if (tokenParam && tokenParam.trim().length > 0) {
      verifyToken(tokenParam.trim());
    }
  }, [tokenParam]);

  async function verifyToken(tokenToVerify: string) {
    try {
      setVerifying(true);
      await authService.verifyEmail(tokenToVerify);

      Alert.alert('Email Verified', 'Your email has been successfully verified! You can log in now.', [
        { text: 'Log In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message ?? 'This verification link is invalid or has expired.',
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerify() {
    if (!token.trim()) {
      Alert.alert('Validation', 'Please enter or paste the verification code.');
      return;
    }
    await verifyToken(token.trim());
  }

  async function handleResend() {
    if (!email.trim()) {
      Alert.alert('Validation', 'Enter your email address to resend the verification link.');
      return;
    }

    try {
      setResending(true);
      const response = await authService.resendVerification(email.trim());
      Alert.alert('Verification Sent', response.message ?? 'Check your inbox for a new verification link.');
    } catch (error: any) {
      Alert.alert(
        'Unable to Resend',
        error?.response?.data?.message ?? 'Could not send verification email. Try again.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Verify Email"
      subtitle="Enter your verification code or open the link from your email."
      footer={
        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkText}>Back to Login</Text>
        </Pressable>
      }
    >
      <GlassInput
        icon="shield-check-outline"
        placeholder="Verification code"
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />

      <GlassButton title="Verify Email" loading={verifying} onPress={handleVerify} />

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.or}>or resend</Text>
        <View style={styles.line} />
      </View>

      <GlassInput
        icon="email-outline"
        placeholder="Email address (for resend)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <GlassButton
        title={resending ? 'Sending Email...' : 'Resend Verification Email'}
        variant="glass"
        loading={resending}
        onPress={handleResend}
      />
    </AuthScreenLayout>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 6,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: g.glassBorder,
    },
    or: {
      color: g.textFaint,
      fontSize: 12.5,
      fontWeight: '600',
    },
    linkText: {
      color: g.accent,
      fontWeight: '700',
      fontSize: 14.5,
    },
  });
}
