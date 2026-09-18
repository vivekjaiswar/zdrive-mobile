import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const AUTO_BACKUP_KEY = 'autoPhotoBackupEnabled';
const LAST_BACKUP_KEY = 'lastPhotoBackupTime';

interface BackupStore {
  autoBackupEnabled: boolean;
  lastBackupTime: string | null;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  setAutoBackupEnabled: (enabled: boolean) => Promise<void>;
  setLastBackupTime: (time: string) => Promise<void>;
}

export const useBackupStore = create<BackupStore>((set) => ({
  autoBackupEnabled: false,
  lastBackupTime: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const enabled = await SecureStore.getItemAsync(AUTO_BACKUP_KEY);
      const lastTime = await SecureStore.getItemAsync(LAST_BACKUP_KEY);

      set({
        autoBackupEnabled: enabled === 'true',
        lastBackupTime: lastTime,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setAutoBackupEnabled: async (enabled: boolean) => {
    await SecureStore.setItemAsync(AUTO_BACKUP_KEY, enabled ? 'true' : 'false').catch(() => {});
    set({ autoBackupEnabled: enabled });
  },

  setLastBackupTime: async (time: string) => {
    await SecureStore.setItemAsync(LAST_BACKUP_KEY, time).catch(() => {});
    set({ lastBackupTime: time });
  },
}));
