import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Keep the native splash screen visible while fonts and initial state load
SplashScreen.preventAutoHideAsync().catch(() => {});

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Forum_400Regular } from '@expo-google-fonts/forum';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import LockScreen from '@/components/security/LockScreen';
import StartupAnimation from '@/components/common/StartupAnimation';
import { setUnauthorizedHandler } from '@/services/api';
import { configureGoogleSignin } from '@/constants/google';
import { SENTRY_DSN } from '@/constants/sentry';
import { useAuthStore } from '@/store/auth.store';
import { useSecurityStore } from '@/store/security.store';
import { useBackupStore } from '@/store/backup.store';
import { useReleaseAdminStore } from '@/store/releaseAdmin.store';
import { useColors } from '@/theme/useColors';

// Must run once at module scope (not inside the component) so it's
// wired up before anything else in the app can throw. An empty DSN
// (see src/constants/sentry.ts) makes this a safe no-op.
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
    // Sends a session on every app start/foreground so crash-free-rate
    // (a useful beta health metric) is tracked, not just hard errors.
    enableAutoSessionTracking: true,
    // Security review finding: console.error(e) call sites across the
    // app log raw error/response objects (see api.ts call sites in
    // trash.tsx, files.tsx, etc.). Sentry's default console
    // integration turns every console.error into a breadcrumb
    // attached to the next captured exception - without this, that
    // raw data (which could include response bodies or a signed
    // download-ticket URL) would ship to a third party unscrubbed.
    // Stripping the breadcrumb's `data` keeps the "an error was
    // logged here" signal without the payload.
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.category === 'console') {
        return { ...breadcrumb, data: undefined };
      }
      return breadcrumb;
    },
    // Defense in depth: signed content tickets (60s-lived, see
    // files.service.ts) are low-risk if leaked, but there's no reason
    // to retain them in Sentry at all - redact if one ever ends up in
    // a captured request URL.
    beforeSend: (event) => {
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /([?&]ticket=)[^&]+/,
          '$1[Redacted]',
        );
      }
      return event;
    },
  });
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Forum_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const colors = useColors();
  const maintenanceMode = useReleaseAdminStore((state) => state.maintenanceMode);
  const maintenanceMessage = useReleaseAdminStore((state) => state.maintenanceMessage);

  const biometricEnabled = useSecurityStore((state) => state.biometricEnabled);
  const biometricAvailable = useSecurityStore((state) => state.biometricAvailable);
  const securityHydrated = useSecurityStore((state) => state.isHydrated);
  const hydrateSecurity = useSecurityStore((state) => state.hydrate);

  // Locking only ever makes sense once we know there's an actual
  // session to protect (no point locking the login screen itself)
  // and once both stores have finished hydrating. v1.2.1: there's no
  // local token to check anymore - `user` is only populated once
  // hydrate() confirms the httpOnly session cookie is actually valid.
  const shouldLock =
    authHydrated && securityHydrated && !!user && biometricEnabled && biometricAvailable;

  // Starts `true` so a cold start never flashes real content before
  // the one-time determination effect below has a chance to run.
  const [isLocked, setIsLocked] = useState(true);

  // Mirrors `shouldLock` for the AppState listener below, which is
  // only ever registered once - reading a plain closure variable
  // there would go stale the moment shouldLock's inputs change.
  const shouldLockRef = useRef(shouldLock);
  const appState = useRef(AppState.currentState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    hydrateSecurity();
    // Read the persisted auto-photo-backup preference back from SecureStore
    // at boot. Without this the store always initialised to `false`, so the
    // Settings toggle silently reset to OFF on every launch even after the
    // user turned it on. getState() avoids adding a re-render subscription
    // here; the Settings screen reads the hydrated value via its selector.
    useBackupStore.getState().hydrate();
    useReleaseAdminStore.getState().hydrate();
    // Idempotent; no-op if no web client ID was provided at build time.
    configureGoogleSignin();
  }, []);

  // Wired once at app boot. api.ts can't import auth.store.ts directly
  // (auth.store.ts already imports api.ts), so this registers the
  // handler instead of api.ts reaching back into the store itself.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      router.replace('/(auth)/login');
    });
  }, [logout]);

  useEffect(() => {
    shouldLockRef.current = shouldLock;
  }, [shouldLock]);

  // Runs exactly once, the first time both stores have finished
  // hydrating - decides whether THIS cold start should open locked.
  // Deliberately not re-run on every later change to `shouldLock`
  // (e.g. logging in mid-session, or toggling the Settings switch)
  // so turning the feature on doesn't immediately lock the user out
  // of the screen they're already looking at - only a genuine
  // background/foreground cycle does that, handled below.
  useEffect(() => {
    if (!authHydrated || !securityHydrated) return;
    if (hasInitialized.current) return;

    hasInitialized.current = true;
    setIsLocked(shouldLock);
  }, [authHydrated, securityHydrated, shouldLock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      // Lock the instant the app leaves the foreground - not on the
      // way back in - so sensitive content is never visible in the
      // OS app-switcher's snapshot either.
      if (appState.current === 'active' && nextState !== 'active') {
        // Do NOT lock if a system photo picker, document picker, or camera is active
        if (useSecurityStore.getState().isPickerActive) {
          appState.current = nextState;
          return;
        }
        if (shouldLockRef.current) setIsLocked(true);
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Single source of truth for status bar style now - Screen.tsx
          used to also render its own StatusBar (from react-native
          directly), which meant two separate implementations were
          fighting over the same native module. This is the only one
          left, driven by the same light/dark palette every themed
          screen uses. */}
      <StatusBar style={colors.statusBarStyle} />

      {maintenanceMode && (
        <View style={layoutStyles.maintenanceBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#FFFFFF" />
          <Text style={layoutStyles.maintenanceText} numberOfLines={2}>
            {maintenanceMessage}
          </Text>
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      {isLocked && shouldLock && (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      )}

      <StartupAnimation />
    </GestureHandlerRootView>
  );
}

// Sentry.wrap adds an error boundary (so a crash reports before the
// app goes down instead of silently) plus automatic navigation
// breadcrumbs. Only wrap when Sentry.init() actually ran above - doing
// it unconditionally caused "Sentry.wrap was called before
// Sentry.init" warnings on every launch while SENTRY_DSN is empty.
export default SENTRY_DSN ? Sentry.wrap(RootLayout) : RootLayout;

const layoutStyles = StyleSheet.create({
  maintenanceBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 10,
    gap: 8,
    zIndex: 9999,
  },
  maintenanceText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
});