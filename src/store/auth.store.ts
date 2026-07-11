import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import api from '@/services/api';
import authService from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  plan: string;
  role: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  // Whether we've finished checking SecureStore for a saved session.
  // The router should show a loading state, not redirect, until this
  // is true - otherwise every cold start flashes the login screen
  // before a valid saved token has had a chance to load.
  isHydrated: boolean;

  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setToken: (token) => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }

    set({ token });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    // Best-effort server-side revocation (bumps tokenVersion) - must
    // happen BEFORE the Authorization header is cleared, since the
    // request needs the current token to know which user to revoke.
    // Wrapped so a network failure (offline, server down) never blocks
    // the local logout - the user should always be able to log out of
    // the app on their own device regardless of connectivity.
    try {
      await authService.logout();
    } catch {
      // Ignored - local session is cleared below regardless.
    }

    await SecureStore.deleteItemAsync('accessToken');
    delete api.defaults.headers.common.Authorization;
    set({ token: null, user: null });
  },

  // Called once on app boot (see src/app/index.tsx). Reads the token
  // that login.tsx persisted with SecureStore, re-attaches it to the
  // axios client, and confirms it's still valid via GET /auth/me
  // before trusting it - a token can be present but expired/revoked.
  hydrate: async () => {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      set({ isHydrated: true });
      return;
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    try {
      const user = await authService.me();

      set({ token, user, isHydrated: true });
    } catch (e) {
      // Expired/invalid token - don't strand the user on a dead
      // session, fall back to a clean logged-out state.
      await SecureStore.deleteItemAsync('accessToken');
      delete api.defaults.headers.common.Authorization;

      set({ token: null, user: null, isHydrated: true });
    }
  },
}));
