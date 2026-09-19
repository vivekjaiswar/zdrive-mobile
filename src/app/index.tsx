import { useEffect } from 'react';
import { Redirect } from 'expo-router';

import GlassScreen from '@/components/glass/GlassScreen';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { useAuthStore } from '@/store/auth.store';
import { useConsentStore } from '@/store/consent.store';
import { useOnboardingStore } from '@/store/onboarding.store';

export default function Index() {
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
      <GlassScreen>
        <DashboardSkeleton />
      </GlassScreen>
    );
  }

  if (!hasAcceptedTerms) {
    return <Redirect href="/consent" />;
  }

  if (!hasSeenPrimer) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={user ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
