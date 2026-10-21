import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ADMIN_FLAGS_KEY = 'oji_admin_feature_flags';
const ADMIN_RELEASE_KEY = 'oji_admin_release_meta';
const ADMIN_ERRORS_KEY = 'oji_admin_error_reports';

export type ReleaseStatus = 'STABLE' | 'HOTFIX' | 'ROLLED_BACK';
export type ReleaseChannel = 'production' | 'staging' | 'preview';
export type ErrorSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface FeatureFlags {
  smartSearch: boolean;
  zipExtraction: boolean;
  autoBackup: boolean;
  videoPreview: boolean;
  twoFactorAuth: boolean;
  sentryTelemetry: boolean;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  code?: string;
  endpoint?: string;
  severity: ErrorSeverity;
  resolved: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  smartSearch: true,
  zipExtraction: true,
  autoBackup: true,
  videoPreview: true,
  twoFactorAuth: true,
  sentryTelemetry: true,
};

interface ReleaseAdminStore {
  appVersion: string;
  buildNumber: string;
  releaseChannel: ReleaseChannel;
  releaseStatus: ReleaseStatus;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: FeatureFlags;
  errorReports: ErrorReport[];
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  setFeatureFlag: (flag: keyof FeatureFlags, enabled: boolean) => Promise<void>;
  rollbackAllFeatures: () => Promise<void>;
  restoreAllFeatures: () => Promise<void>;
  setReleaseStatus: (status: ReleaseStatus) => Promise<void>;
  setReleaseChannel: (channel: ReleaseChannel) => Promise<void>;
  setMaintenanceMode: (enabled: boolean, message?: string) => Promise<void>;
  addErrorReport: (report: Omit<ErrorReport, 'id' | 'timestamp' | 'resolved'>) => Promise<void>;
  markReportResolved: (id: string) => Promise<void>;
  clearErrorReports: () => Promise<void>;
}

export const useReleaseAdminStore = create<ReleaseAdminStore>((set, get) => ({
  appVersion: '1.9.4',
  buildNumber: '17',
  releaseChannel: 'production',
  releaseStatus: 'STABLE',
  maintenanceMode: false,
  maintenanceMessage: 'OJI Drive is temporarily down for scheduled backend upgrades.',
  featureFlags: DEFAULT_FLAGS,
  errorReports: [],
  isHydrated: false,

  hydrate: async () => {
    try {
      const [savedFlags, savedMeta, savedErrors] = await Promise.all([
        SecureStore.getItemAsync(ADMIN_FLAGS_KEY),
        SecureStore.getItemAsync(ADMIN_RELEASE_KEY),
        SecureStore.getItemAsync(ADMIN_ERRORS_KEY),
      ]);

      const flags = savedFlags ? JSON.parse(savedFlags) : DEFAULT_FLAGS;
      const meta = savedMeta ? JSON.parse(savedMeta) : {};
      const errors = savedErrors ? JSON.parse(savedErrors) : [];

      set({
        featureFlags: { ...DEFAULT_FLAGS, ...flags },
        releaseStatus: meta.releaseStatus ?? 'STABLE',
        releaseChannel: meta.releaseChannel ?? 'production',
        maintenanceMode: meta.maintenanceMode ?? false,
        maintenanceMessage: meta.maintenanceMessage ?? get().maintenanceMessage,
        errorReports: Array.isArray(errors) ? errors : [],
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setFeatureFlag: async (flag: keyof FeatureFlags, enabled: boolean) => {
    const updatedFlags = { ...get().featureFlags, [flag]: enabled };
    set({ featureFlags: updatedFlags });
    await SecureStore.setItemAsync(ADMIN_FLAGS_KEY, JSON.stringify(updatedFlags)).catch(() => {});
  },

  rollbackAllFeatures: async () => {
    const rolledBackFlags: FeatureFlags = {
      smartSearch: false,
      zipExtraction: false,
      autoBackup: false,
      videoPreview: false,
      twoFactorAuth: false,
      sentryTelemetry: false,
    };
    set({ featureFlags: rolledBackFlags, releaseStatus: 'ROLLED_BACK' });
    await Promise.all([
      SecureStore.setItemAsync(ADMIN_FLAGS_KEY, JSON.stringify(rolledBackFlags)).catch(() => {}),
      SecureStore.setItemAsync(
        ADMIN_RELEASE_KEY,
        JSON.stringify({
          releaseStatus: 'ROLLED_BACK',
          releaseChannel: get().releaseChannel,
          maintenanceMode: get().maintenanceMode,
          maintenanceMessage: get().maintenanceMessage,
        }),
      ).catch(() => {}),
    ]);
  },

  restoreAllFeatures: async () => {
    set({ featureFlags: DEFAULT_FLAGS, releaseStatus: 'STABLE' });
    await Promise.all([
      SecureStore.setItemAsync(ADMIN_FLAGS_KEY, JSON.stringify(DEFAULT_FLAGS)).catch(() => {}),
      SecureStore.setItemAsync(
        ADMIN_RELEASE_KEY,
        JSON.stringify({
          releaseStatus: 'STABLE',
          releaseChannel: get().releaseChannel,
          maintenanceMode: get().maintenanceMode,
          maintenanceMessage: get().maintenanceMessage,
        }),
      ).catch(() => {}),
    ]);
  },

  setReleaseStatus: async (status: ReleaseStatus) => {
    set({ releaseStatus: status });
    await SecureStore.setItemAsync(
      ADMIN_RELEASE_KEY,
      JSON.stringify({
        releaseStatus: status,
        releaseChannel: get().releaseChannel,
        maintenanceMode: get().maintenanceMode,
        maintenanceMessage: get().maintenanceMessage,
      }),
    ).catch(() => {});
  },

  setReleaseChannel: async (channel: ReleaseChannel) => {
    set({ releaseChannel: channel });
    await SecureStore.setItemAsync(
      ADMIN_RELEASE_KEY,
      JSON.stringify({
        releaseStatus: get().releaseStatus,
        releaseChannel: channel,
        maintenanceMode: get().maintenanceMode,
        maintenanceMessage: get().maintenanceMessage,
      }),
    ).catch(() => {});
  },

  setMaintenanceMode: async (enabled: boolean, message?: string) => {
    const msg = message ?? get().maintenanceMessage;
    set({ maintenanceMode: enabled, maintenanceMessage: msg });
    await SecureStore.setItemAsync(
      ADMIN_RELEASE_KEY,
      JSON.stringify({
        releaseStatus: get().releaseStatus,
        releaseChannel: get().releaseChannel,
        maintenanceMode: enabled,
        maintenanceMessage: msg,
      }),
    ).catch(() => {});
  },

  addErrorReport: async (report) => {
    const newReport: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...report,
    };
    // Keep last 50 error reports
    const updated = [newReport, ...get().errorReports].slice(0, 50);
    set({ errorReports: updated });
    await SecureStore.setItemAsync(ADMIN_ERRORS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  markReportResolved: async (id: string) => {
    const updated = get().errorReports.map((r) => (r.id === id ? { ...r, resolved: true } : r));
    set({ errorReports: updated });
    await SecureStore.setItemAsync(ADMIN_ERRORS_KEY, JSON.stringify(updated)).catch(() => {});
  },

  clearErrorReports: async () => {
    set({ errorReports: [] });
    await SecureStore.deleteItemAsync(ADMIN_ERRORS_KEY).catch(() => {});
  },
}));
