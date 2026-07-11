import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import biometricService from '@/services/biometric.service';

const STORAGE_KEY = 'biometricLockEnabled';

interface SecurityStore {
  // Whether the user wants the app lock active. Defaults to `true`
  // the first time the app runs on a device that actually supports
  // biometrics (product decision: on by default, not opt-in) - only
  // ever `false` after the user explicitly turns it off, or on a
  // device that can't support it at all.
  biometricEnabled: boolean;
  // Whether this device has usable biometric hardware AND at least
  // one biometric enrolled. Both the Settings toggle and the lock
  // gate in _layout.tsx need this - never show a lock screen (or the
  // toggle to enable one) that the device can't actually satisfy.
  biometricAvailable: boolean;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  biometricEnabled: false,
  biometricAvailable: false,
  isHydrated: false,

  hydrate: async () => {
    const available = await biometricService.isAvailable();
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);

    // No stored preference yet - default "on" when the device can
    // actually support it, otherwise the setting is moot regardless
    // of its stored value.
    const enabled = available && (stored === null ? true : stored === 'true');

    set({
      biometricAvailable: available,
      biometricEnabled: enabled,
      isHydrated: true,
    });
  },

  setBiometricEnabled: async (enabled) => {
    await SecureStore.setItemAsync(STORAGE_KEY, enabled ? 'true' : 'false');
    set({ biometricEnabled: enabled });
  },
}));
