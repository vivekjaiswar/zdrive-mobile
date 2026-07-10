import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { setUnauthorizedHandler } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';

export default function RootLayout() {
  const logout = useAuthStore((state) => state.logout);

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
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      />
    </GestureHandlerRootView>
  );
}