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

  // Consent is required from EVERY user on this device, logged in or
  // not - the Privacy Policy itself names user consent as the legal
  // basis for processing data, so a session that predates this gate
  // (e.g. an existing tester who logged in before this feature
  // shipped) still needs to explicitly agree once. consent.tsx reads
  // the token itself to decide where "Continue" sends them next.
  if (!hasAcceptedTerms) {
    return <Redirect href="/consent" />;
  }

  return <Redirect href={token ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
