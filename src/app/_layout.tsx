import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LockScreen from '@/components/security/LockScreen';
import { setUnauthorizedHandler } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useSecurityStore } from '@/store/security.store';
import { useColors } from '@/theme/useColors';

export default function RootLayout() {
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const colors = useColors();

  const biometricEnabled = useSecurityStore((state) => state.biometricEnabled);
  const biometricAvailable = useSecurityStore((state) => state.biometricAvailable);
  const securityHydrated = useSecurityStore((state) => state.isHydrated);
  const hydrateSecurity = useSecurityStore((state) => state.hydrate);

  // Locking only ever makes sense once we know there's an actual
  // session to protect (no point locking the login screen itself)
  // and once both stores have finished reading from SecureStore.
  const shouldLock =
    authHydrated && securityHydrated && !!token && biometricEnabled && biometricAvailable;

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
        if (shouldLockRef.current) setIsLocked(true);
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Single source of truth for status bar style now - Screen.tsx
          used to also render its own StatusBar (from react-native
          directly), which meant two separate implementations were
          fighting over the same native module. This is the only one
          left, driven by the same light/dark palette every themed
          screen uses. */}
      <StatusBar style={colors.statusBarStyle} />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      {isLocked && shouldLock && (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      )}
    </GestureHandlerRootView>
  );
}