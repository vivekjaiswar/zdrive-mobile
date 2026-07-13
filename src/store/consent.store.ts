import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface ConsentStore {
  hasAccepted: boolean;
  // Whether we've finished checking SecureStore for a prior
  // acceptance - mirrors auth.store.ts's isHydrated pattern. The
  // router (see src/app/index.tsx) must wait for this before
  // deciding whether to show the consent gate, or a cold start would
  // flash it for one frame even for users who accepted it months ago.
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  accept: () => Promise<void>;
}

// Deliberately separate from auth.store - acceptance is tied to THIS
// DEVICE/install, not to a logged-in session. A user who accepts,
// then logs out, should not be shown the gate again on the same
// device; a fresh install always should be, even if they're about to
// log back into an existing account.
export const useConsentStore = create<ConsentStore>((set) => ({
  hasAccepted: false,
  isHydrated: false,

  hydrate: async () => {
    const value = await SecureStore.getItemAsync('termsAccepted');
    set({ hasAccepted: value === 'true', isHydrated: true });
  },

  accept: async () => {
    await SecureStore.setItemAsync('termsAccepted', 'true');
    set({ hasAccepted: true });
  },
}));
