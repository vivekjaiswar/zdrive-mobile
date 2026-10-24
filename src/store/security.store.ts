import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import biometricService from '@/services/biometric.service';

const STORAGE_KEY = 'biometricLockEnabled';
const BIOMETRIC_CREDENTIALS_KEY = 'oji_biometric_credentials';

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

  // True while a native system picker (photos, files, camera) is presented
  // so AppState background/inactive transitions don't erroneously trigger the lock screen.
  isPickerActive: boolean;
  setPickerActive: (active: boolean) => void;

  savedBiometricEmail: string | null;
  saveBiometricCredentials: (email: string, password?: string) => Promise<void>;
  getBiometricCredentials: () => Promise<{ email: string; password?: string } | null>;
  clearBiometricCredentials: () => Promise<void>;

  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  biometricEnabled: false,
  biometricAvailable: false,
  isHydrated: false,
  isPickerActive: false,
  savedBiometricEmail: null,

  setPickerActive: (active) => set({ isPickerActive: active }),

  hydrate: async () => {
    const available = await biometricService.isAvailable();
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    const credsData = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY).catch(() => null);
    let savedEmail: string | null = null;
    if (credsData) {
      try {
        const parsed = JSON.parse(credsData);
        savedEmail = parsed.email || null;
      } catch {}
    }

    // No stored preference yet - default "on" when the device can
    // actually support it, otherwise the setting is moot regardless
    // of its stored value.
    const enabled = available && (stored === null ? true : stored === 'true');

    set({
      biometricAvailable: available,
      biometricEnabled: enabled,
      savedBiometricEmail: savedEmail,
      isHydrated: true,
    });
  },

  setBiometricEnabled: async (enabled) => {
    await SecureStore.setItemAsync(STORAGE_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY).catch(() => {});
      set({ biometricEnabled: false, savedBiometricEmail: null });
    } else {
      set({ biometricEnabled: true });
    }
  },

  saveBiometricCredentials: async (email, password) => {
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify({ email, password: password ?? '', timestamp: Date.now() }),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
      );
      set({ savedBiometricEmail: email });
    } catch {}
  },

  getBiometricCredentials: async () => {
    try {
      const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (!data) return null;
      return JSON.parse(data) as { email: string; password?: string };
    } catch {
      return null;
    }
  },

  clearBiometricCredentials: async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY).catch(() => {});
    set({ savedBiometricEmail: null });
  },
}));

// Wraps system picker / gallery interactions so the app does not lock
// when the OS presents the photo library or file picker sheet.
export async function runWithPickerBypass<T>(action: () => Promise<T>): Promise<T> {
  const store = useSecurityStore.getState();
  store.setPickerActive(true);
  try {
    return await action();
  } finally {
    setTimeout(() => {
      useSecurityStore.getState().setPickerActive(false);
    }, 1500);
  }
}
