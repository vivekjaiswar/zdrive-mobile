import { GoogleSignin } from '@react-native-google-signin/google-signin';

// The "Web" OAuth client ID from Google Cloud Console - NOT a secret (OAuth
// client IDs are public by design). Passing it as webClientId is what makes
// GoogleSignin return an ID token whose `aud` equals this value, which is
// exactly what the backend verifies against (GOOGLE_CLIENT_ID). Sourced from
// an EXPO_PUBLIC_ env var so it can differ per environment and isn't baked
// into source; set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in the build env.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

// iOS OAuth client ID - left unset for now (iOS Google sign-in isn't wired
// yet; needs a paid Apple Developer account and an iOS OAuth client). When
// that happens, set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and pass it below.
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? undefined;

// Whether Google sign-in is actually usable in this build. If the web client
// ID wasn't provided at build time, the button should hide itself rather than
// open a sheet that can never return a valid token.
export const isGoogleSignInConfigured = GOOGLE_WEB_CLIENT_ID.length > 0;

// Idempotent - safe to call more than once. Called once at app boot
// (_layout) so the button never has to worry about ordering.
export function configureGoogleSignin() {
  if (!isGoogleSignInConfigured) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    // We only need the ID token for backend verification - not offline
    // access / server-side refresh tokens.
    offlineAccess: false,
  });
}
