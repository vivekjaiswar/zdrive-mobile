import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

import authService from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  plan: string;
  role: string;
}

// v1.2.1: the backend switched from a Bearer token in the JSON response
// body to an httpOnly session cookie (zd_session) that JwtStrategy reads
// exclusively - there's no Authorization-header fallback anymore, and no
// token value this app can ever read (that's the point of httpOnly).
// The native networking layer (see api.ts's withCredentials) stores and
// resends that cookie automatically, the same way a browser would - this
// store no longer holds or manages a token at all. "Authenticated" is now
// just "do we have a user object," and the real source of truth for
// whether the session is actually valid is always a live GET /auth/me
// call, not anything cached locally.
interface AuthStore {
  user: User | null;
  // Whether we've finished the initial GET /auth/me check on boot. The
  // router should show a loading state, not redirect, until this is
  // true - otherwise every cold start flashes the login screen before
  // we've had a chance to find out the cookie is actually still valid.
  isHydrated: boolean;

  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

// Legacy key from the pre-v1.2.1 Bearer-token build. Nothing reads this
// anymore, but older installs may still have a stale value sitting in
// SecureStore - clean it up opportunistically so it doesn't linger.
const LEGACY_TOKEN_KEY = 'accessToken';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => set({ user }),

  logout: async () => {
    // Best-effort server-side revocation (bumps tokenVersion and clears
    // the zd_session cookie). Wrapped so a network failure (offline,
    // server down) never blocks the local logout - the user should
    // always be able to log out of the app on their own device
    // regardless of connectivity.
    try {
      await authService.logout();
    } catch {
      // Ignored - local session is cleared below regardless.
    }

    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY).catch(() => {});
    set({ user: null });
  },

  // Called once on app boot (see src/app/index.tsx). There's no local
  // token to read anymore - the httpOnly cookie (if any) is already
  // attached automatically by the native networking layer, so the only
  // way to know whether a session is actually still valid is to just
  // ask the server.
  hydrate: async () => {
    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY).catch(() => {});

    try {
      const user = await authService.me();

      set({ user, isHydrated: true });
    } catch (e) {
      // No cookie, or an expired/revoked one - fall back to a clean
      // logged-out state rather than stranding the user.
      set({ user: null, isHydrated: true });
    }
  },
}));
