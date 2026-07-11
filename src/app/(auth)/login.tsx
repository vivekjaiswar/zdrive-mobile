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

import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
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

  const setToken = useAuthStore((state) => state.setToken);
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

      await SecureStore.setItemAsync(
        'accessToken',
        response.accessToken,
      );

      // setToken attaches the Authorization header to the shared
      // axios instance too - no need to do it manually here.
      setToken(response.accessToken);
      setUser(response.user);

      router.replace('/(tabs)/dashboard');

    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ??
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
                secureTextEntry
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