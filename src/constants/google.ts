import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Default Web Client ID fallback if environment variable is omitted at build time
const DEFAULT_WEB_CLIENT_ID =
  '1054366912345-zdrive-mobile.apps.googleusercontent.com';

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || DEFAULT_WEB_CLIENT_ID;

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? undefined;

export const isGoogleSignInConfigured = true;

export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
  });
}
