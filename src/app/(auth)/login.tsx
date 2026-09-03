import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
import AuthDivider from '@/components/auth/AuthDivider';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import Screen from '@/components/Layout/Screen';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

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

      const response = await authService.login({
        email: email.trim(),
        password,
      });

      // v1.4.0: a 2FA-enabled account gets no session cookie here at
      // all - just a short-lived challengeToken - and has to complete
      // the code-entry screen before setUser/dashboard makes sense.
      if (response.twoFactorRequired) {
        router.push({
          pathname: '/(auth)/two-factor',
          params: { challengeToken: response.challengeToken },
        });
        return;
      }

      // v1.2.1: the session itself arrives as a Set-Cookie header on
      // this same response (httpOnly, handled automatically by the
      // native cookie jar - see api.ts's withCredentials). There's no
      // token in the body anymore to store or attach manually.
      setUser(response.user);

      router.replace('/(tabs)/dashboard');

    } catch (error: any) {
      // Falls back to error.message (e.g. "Network Error") before the
      // generic string, rather than hiding it - that distinction is
      // exactly what confirmed the v1.2.1 cookie-auth switch itself was
      // working (a real 401 with a server message, not a silent
      // client-side failure).
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ??
          error?.message ??
          'Unable to login.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../../../assets/logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />

          <View style={styles.card}>
            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              Sign in to continue to your cloud.
            </Text>

            <View style={styles.form}>
              <AppInput
                placeholder="Email Address"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <AppInput
                placeholder="Password"
                isPassword
                value={password}
                onChangeText={setPassword}
              />

              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgot}>
                  Forgot Password?
                </Text>
              </Pressable>

              <PrimaryButton
                title="Login"
                loading={loading}
                onPress={handleLogin}
              />

              <AuthDivider />

              <GoogleSignInButton />
            </View>

            <View style={styles.bottom}>
              <Text style={styles.bottomText}>
                Don't have an account?
              </Text>

              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.register}>
                  Create Account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 40,
    },

    logo: {
      width: 210,
      height: 70,
      alignSelf: 'center',
      marginBottom: 24,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,

      paddingHorizontal: 24,
      paddingVertical: 28,
    },

    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    subtitle: {
      marginTop: 10,
      fontSize: 14.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },

    form: {
      marginTop: 28,
      gap: 16,
    },

    forgot: {
      textAlign: 'right',
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
      marginBottom: 6,
    },

    bottom: {
      marginTop: 28,
      flexDirection: 'row',
      justifyContent: 'center',
    },

    bottomText: {
      color: colors.textSecondary,
      fontSize: 15,
    },

    register: {
      marginLeft: 5,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 15,
    },
  });
}