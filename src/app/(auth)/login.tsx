import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import GlassScreen from '@/components/glass/GlassScreen';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import GlassInput from '@/components/glass/GlassInput';
import Logo from '@/components/glass/Logo';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import authService, { LoginUser } from '@/services/auth.service';
import biometricService from '@/services/biometric.service';
import { useAuthStore } from '@/store/auth.store';
import { useSecurityStore } from '@/store/security.store';
import { GlassTheme, useGlass } from '@/theme/glass';

export default function LoginScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [bioTypeName, setBioTypeName] = useState('Biometrics');
  const [hasBiometricLogin, setHasBiometricLogin] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);
  const {
    biometricAvailable,
    biometricEnabled,
    savedBiometricEmail,
    saveBiometricCredentials,
    getBiometricCredentials,
    clearBiometricCredentials,
  } = useSecurityStore();
  const google = useGoogleSignIn();

  useEffect(() => {
    biometricService.getBiometricTypeName().then(setBioTypeName).catch(() => {});
    if (savedBiometricEmail) {
      setEmail((prev) => (prev ? prev : savedBiometricEmail));
      setHasBiometricLogin(true);
    }
  }, [savedBiometricEmail]);

  async function completeLoginFlow(
    user: LoginUser,
    userEmail: string,
    userPassword?: string,
  ) {
    if (userPassword) {
      await saveBiometricCredentials(userEmail, userPassword);
    }
    setUser(user);
    router.replace('/(tabs)/dashboard');
  }

  async function handleBiometricLogin() {
    try {
      setLoading(true);
      const authenticated = await biometricService.authenticate(
        `Log in with ${bioTypeName}`,
      );
      if (!authenticated) {
        setLoading(false);
        return;
      }

      const creds = await getBiometricCredentials();
      if (!creds || !creds.email || !creds.password) {
        Alert.alert(
          'Saved Login Expired',
          'Please enter your password manually to log in and re-enable biometric access.',
        );
        setHasBiometricLogin(false);
        setLoading(false);
        return;
      }

      const response = await authService.login({
        email: creds.email,
        password: creds.password,
      });

      if (response.twoFactorRequired) {
        router.push({
          pathname: '/(auth)/two-factor',
          params: { challengeToken: response.challengeToken },
        });
        return;
      }

      await completeLoginFlow(response.user, creds.email, creds.password);
    } catch (error: any) {
      Alert.alert(
        'Biometric Login Failed',
        error?.response?.data?.message ??
          'Saved credentials could not be verified. Please enter your password.',
      );
      if (error?.response?.status === 401) {
        await clearBiometricCredentials();
        setHasBiometricLogin(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({ email: email.trim(), password });

      // 2FA accounts get no session here - just a challenge token.
      if (response.twoFactorRequired) {
        router.push({
          pathname: '/(auth)/two-factor',
          params: { challengeToken: response.challengeToken },
        });
        return;
      }

      // Prompt for biometric verification upon login if device supports it and it is enabled
      if (biometricAvailable && biometricEnabled) {
        const bioOk = await biometricService.authenticate(
          `Confirm with ${bioTypeName} to complete login`,
        );

        if (!bioOk) {
          Alert.alert(
            'Biometric Verification Required',
            `Authentication with ${bioTypeName} is required to complete login.`,
            [
              {
                text: 'Try Again',
                onPress: async () => {
                  const retry = await biometricService.authenticate(
                    `Confirm with ${bioTypeName} to complete login`,
                  );
                  if (retry) {
                    await completeLoginFlow(response.user, email.trim(), password);
                  }
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
          return;
        }
      }

      await completeLoginFlow(response.user, email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ?? error?.message ?? 'Unable to login.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Logo size={52} />
          </View>

          <GlassCard padding={24} radius={28}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue to your cloud.</Text>

            <View style={styles.form}>
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

              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              <GlassButton title="Login" loading={loading} onPress={handleLogin} />

              {hasBiometricLogin && biometricAvailable && biometricEnabled && (
                <GlassButton
                  title={`Login with ${bioTypeName}`}
                  icon="fingerprint"
                  variant="glass"
                  loading={loading}
                  onPress={handleBiometricLogin}
                />
              )}

              {google.available && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.line} />
                    <Text style={styles.or}>or</Text>
                    <View style={styles.line} />
                  </View>

                  <GlassButton
                    title="Continue with Google"
                    variant="google"
                    loading={google.loading}
                    onPress={google.signIn}
                  />
                </>
              )}
            </View>
          </GlassCard>

          <View style={styles.bottom}>
            <Text style={styles.bottomText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.register}>Create Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassScreen>
  );
}

import { fonts } from '@/theme/typography';

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
    logoWrap: { alignItems: 'center', marginBottom: 28 },
    title: {
      fontSize: 30,
      fontFamily: fonts.heading,
      color: g.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14.5,
      fontFamily: fonts.medium,
      color: g.textSecondary,
      textAlign: 'center',
    },
    form: { marginTop: 26, gap: 15 },
    forgot: {
      textAlign: 'right',
      color: g.accent,
      fontFamily: fonts.semiBold,
      fontSize: 13.5,
      marginTop: -2,
      marginBottom: 4,
    },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
    line: { flex: 1, height: 1, backgroundColor: g.glassBorder },
    or: { color: g.textFaint, fontSize: 13, fontFamily: fonts.semiBold },
    bottom: {
      marginTop: 26,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    bottomText: { color: g.textSecondary, fontSize: 14.5, fontFamily: fonts.regular },
    register: { color: g.accent, fontFamily: fonts.bold, fontSize: 14.5 },
  });
}
