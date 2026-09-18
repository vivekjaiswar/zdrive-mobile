import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useColors } from '@/theme/useColors';
import { useAuthStore } from '@/store/auth.store';
import { useConsentStore } from '@/store/consent.store';
import { useOnboardingStore } from '@/store/onboarding.store';

export default function Index() {
  const colors = useColors();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const consentHydrated = useConsentStore((state) => state.isHydrated);
  const hasAcceptedTerms = useConsentStore((state) => state.hasAccepted);
  const hydrateConsent = useConsentStore((state) => state.hydrate);

  const onboardingHydrated = useOnboardingStore((state) => state.isHydrated);
  const hasSeenPrimer = useOnboardingStore((state) => state.hasSeenPrimer);
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
    hydrateConsent();
    hydrateOnboarding();
  }, []);

  if (!isHydrated || !consentHydrated || !onboardingHydrated) {
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
  // the hydrated user itself to decide where "Continue" sends them next.
  if (!hasAcceptedTerms) {
    return <Redirect href="/consent" />;
  }

  // Permissions primer: shown once per device, right after consent.
  // Existing installs that accepted terms before this shipped will see
  // it once on their next launch, then never again. It explains (does
  // not request) the permissions ZDrive uses - the real OS prompts
  // still fire contextually at point of use.
  if (!hasSeenPrimer) {
    return <Redirect href="/onboarding" />;
  }

  // v1.2.1: there's no local token to check anymore - hydrate() above
  // already asked the server (GET /auth/me) whether the httpOnly session
  // cookie is actually valid, and `user` is only set if it was.
  return <Redirect href={user ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
