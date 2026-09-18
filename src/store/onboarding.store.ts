import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface OnboardingStore {
  // Whether the one-time permissions primer has been shown on this
  // device. Deliberately NOT tied to a login session (mirrors
  // consent.store): a fresh install re-shows it, a logout does not.
  hasSeenPrimer: boolean;
  // Mirrors consent.store's isHydrated - the router (src/app/index.tsx)
  // must wait for this before deciding whether to show the primer, or a
  // cold start would flash it for one frame for users who saw it long ago.
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  markSeen: () => Promise<void>;
}

// The primer only EXPLAINS which OS permissions ZDrive will ask for and
// why (photos for upload, biometric for the app lock). It never triggers
// the OS permission dialogs itself - those still appear contextually the
// first time each feature is used, which is what Android/iOS require and
// what keeps grant rates high.
export const useOnboardingStore = create<OnboardingStore>((set) => ({
  hasSeenPrimer: false,
  isHydrated: false,

  hydrate: async () => {
    const value = await SecureStore.getItemAsync('permissionsPrimerSeen');
    set({ hasSeenPrimer: value === 'true', isHydrated: true });
  },

  markSeen: async () => {
    await SecureStore.setItemAsync('permissionsPrimerSeen', 'true');
    set({ hasSeenPrimer: true });
  },
}));
