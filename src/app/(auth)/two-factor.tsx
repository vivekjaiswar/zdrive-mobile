import { useState } from 'react';
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

import { useLocalSearchParams, useRouter } from 'expo-router';

import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
import Screen from '@/components/Layout/Screen';
import authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

// Second step of login for a 2FA-enabled account. The backend checks
// `code` against both a 6-digit TOTP and an xxxx-xxxx recovery code in
// the same field, so this screen doesn't need a mode toggle - whatever
// the user types is tried both ways server-side.
export default function TwoFactorScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);
  const { challengeToken } = useLocalSearchParams<{ challengeToken: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  async function handleVerify() {
    if (!code.trim()) {
      Alert.alert('Validation', 'Enter the code from your authenticator app.');
      return;
    }

    if (!challengeToken) {
      Alert.alert(
        'Session Expired',
        'Your login attempt expired. Please log in again.',
      );
      router.replace('/(auth)/login');
      return;
    }

    try {
      setLoading(true);

      const { user } = await authService.verifyTwoFactorLogin(
        challengeToken,
        code.trim(),
      );

      setUser(user);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message ??
          error?.message ??
          'That code was not accepted.',
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
          <View style={styles.card}>
            <Text style={styles.title}>Two-Factor Authentication</Text>

            <Text style={styles.subtitle}>
              Enter the 6-digit code from your authenticator app, or one of
              your recovery codes if you don't have access to it.
            </Text>

            <View style={styles.form}>
              <AppInput
                placeholder="123456"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />

              <PrimaryButton
                title="Verify"
                loading={loading}
                onPress={handleVerify}
              />
            </View>

            <Pressable
              style={styles.back}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.backText}>Back to Login</Text>
            </Pressable>
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

    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 24,
      paddingVertical: 28,
    },

    title: {
      fontSize: 22,
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

    back: {
      marginTop: 20,
      alignItems: 'center',
    },

    backText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 14.5,
    },
  });
}
