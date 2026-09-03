import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  label?: string;
}

// Shared by the login and register screens so the Google flow lives in one
// place. Renders nothing if the build wasn't given a web client ID, so a
// misconfigured build shows no dead button rather than a sheet that can't
// return a usable token.
export default function GoogleSignInButton({
  label = 'Continue with Google',
}: Props) {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);
  const [loading, setLoading] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  if (!isGoogleSignInConfigured) return null;

  async function handlePress() {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // v13+ returns a discriminated result rather than throwing on cancel:
      // a non-success response means the user dismissed the sheet - just
      // stop, no error alert.
      if (!isSuccessResponse(response)) {
        return;
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        Alert.alert(
          'Sign-In Failed',
          'Google did not return a sign-in token. Please try again.',
        );
        return;
      }

      const { user } = await authService.signInWithGoogle(idToken);

      // Session arrives as a Set-Cookie handled by the native cookie jar
      // (api.ts withCredentials) - nothing to store. Mirror the email/
      // password success path exactly.
      setUser(user);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      // Older SDK path / edge cases still surface cancellation as a thrown
      // coded error - swallow that one silently, surface everything else.
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

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <MaterialCommunityIcons name="google" size={20} color={colors.text} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    button: {
      height: 54,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.7,
    },

    label: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15.5,
    },
  });
}
