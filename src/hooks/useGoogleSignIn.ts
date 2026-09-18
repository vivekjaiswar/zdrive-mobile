import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import authService from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { isGoogleSignInConfigured } from '@/constants/google';

// The Google sign-in flow, extracted from the old button so both the
// redesigned login and register screens can drive a plain GlassButton
// without duplicating the native-flow + error handling.
export function useGoogleSignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  async function signIn() {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // Non-success = user dismissed the sheet; just stop, no alert.
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert('Sign-In Failed', 'Google did not return a token. Try again.');
        return;
      }

      const { user } = await authService.signInWithGoogle(idToken);
      setUser(user);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
        if (error.code === statusCodes.IN_PROGRESS) return;
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            'Google Play Services Required',
            'Update or enable Google Play Services to sign in with Google.',
          );
          return;
        }
      }
      Alert.alert(
        'Sign-In Failed',
        error?.response?.data?.message ??
          error?.message ??
          'Unable to sign in with Google.',
      );
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading, available: isGoogleSignInConfigured };
}
