import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import GlassButton from '@/components/glass/GlassButton';
import GlassInput from '@/components/glass/GlassInput';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import authService from '@/services/auth.service';
import { GlassTheme, useGlass } from '@/theme/glass';
import { getPasswordError, PASSWORD_HINT } from '@/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const google = useGoogleSignIn();

  async function handleRegister() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Validation', 'Please enter your email.');
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

      const response = await authService.register(trimmedEmail, password);

      Alert.alert(
        'Check Your Email',
        response.message ??
          'Registration successful. Please verify your email before logging in.',
        [
          {
            text: 'I Have a Code',
            onPress: () =>
              router.replace({
                pathname: '/(auth)/verify-email',
                params: { email: trimmedEmail },
              }),
          },
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error?.response?.data?.message ?? 'Unable to create your account.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Create Account"
      subtitle="Start storing your files securely with ZDrive."
      footer={
        <>
          <Text style={styles.bottomText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>Login</Text>
          </Pressable>
        </>
      }
    >
      <GlassInput
        icon="email-outline"
        placeholder="Email address"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <GlassInput
        icon="lock-outline"
        placeholder="Password"
        isPassword
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.hint}>{PASSWORD_HINT}</Text>

      <GlassInput
        icon="lock-check-outline"
        placeholder="Confirm password"
        isPassword
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <GlassButton title="Create Account" loading={loading} onPress={handleRegister} />

      {google.available && (
        <>
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.or}>or</Text>
            <View style={styles.line} />
          </View>

          <GlassButton
            title="Sign up with Google"
            variant="google"
            loading={google.loading}
            onPress={google.signIn}
          />
        </>
      )}

      <Text style={styles.legalText}>
        By creating an account, you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/legal/terms')}>
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/legal/privacy')}>
          Privacy Policy
        </Text>
        .
      </Text>
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
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 4,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: g.glassBorder,
    },
    or: {
      color: g.textFaint,
      fontSize: 13,
      fontWeight: '600',
    },
    bottomText: {
      color: g.textSecondary,
      fontSize: 15,
    },
    link: {
      color: g.accent,
      fontWeight: '700',
      fontSize: 15,
      marginLeft: 4,
    },
    legalText: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 17,
      color: g.textSecondary,
      textAlign: 'center',
    },
    legalLink: {
      color: g.accent,
      fontWeight: '600',
    },
  });
}
