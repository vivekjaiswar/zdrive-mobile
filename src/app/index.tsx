import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useColors } from '@/theme/useColors';
import { useAuthStore } from '@/store/auth.store';
import { useConsentStore } from '@/store/consent.store';

export default function Index() {
  const colors = useColors();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);
  const hydrate = useAuthStore((state) => state.hydrate);

  const consentHydrated = useConsentStore((state) => state.isHydrated);
  const hasAcceptedTerms = useConsentStore((state) => state.hasAccepted);
  const hydrateConsent = useConsentStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
    hydrateConsent();
  }, []);

  if (!isHydrated || !consentHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // An existing session (token restored from SecureStore) always
  // wins - a user who's already logged in on this device shouldn't
  // be stopped by the consent gate on every cold start. The gate only
  // applies to the pre-login/register path: first-ever launch, or any
  // launch after a logout where consent was never recorded on this
  // device.
  if (token) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href={hasAcceptedTerms ? '/(auth)/login' : '/consent'} />;
}
