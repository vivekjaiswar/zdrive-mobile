import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import PrimaryButton from '@/components/Button/PrimaryButton';
import AppInput from '@/components/Input/AppInput';
import authService from '@/services/auth.service';
import { getAuthStyles } from '@/components/auth/authStyles';
import { useColors } from '@/theme/useColors';
import { getPasswordError, PASSWORD_HINT } from '@/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const authStyles = getAuthStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert('Validation', 'Please enter your email.');
      return;
    }

    // Mirrors RegisterDto's IsStrongPassword rule - the backend
    // enforces this too, but failing fast here saves a round trip.
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

      // register() does NOT log the user in - the backend blocks
      // login until the account is verified via the emailed link.
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
          <Text style={authStyles.bottomText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={authStyles.link}>Login</Text>
          </Pressable>
        </>
      }
    >
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

      <Text style={authStyles.hint}>{PASSWORD_HINT}</Text>

      <AppInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <PrimaryButton title="Create Account" loading={loading} onPress={handleRegister} />
    </AuthScreenLayout>
  );
}
