import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { setUnauthorizedHandler } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useColors } from '@/theme/useColors';

export default function RootLayout() {
  const logout = useAuthStore((state) => state.logout);
  const colors = useColors();

  // Wired once at app boot. api.ts can't import auth.store.ts directly
  // (auth.store.ts already imports api.ts), so this registers the
  // handler instead of api.ts reaching back into the store itself.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      router.replace('/(auth)/login');
    });
  }, [logout]);

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
    </GestureHandlerRootView>
  );
}