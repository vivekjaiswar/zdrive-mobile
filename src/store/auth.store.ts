import { create } from 'zustand';

import authService from '@/services/auth.service';

export interface User {
  id: string;
  email: string;
  plan: string;
  role: string;
  subscriptionExpiresAt?: string | null;
  subscriptionStatus?: string;
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

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isHydrated: false,

  setUser: (user) => set({ user }),

  logout: async () => {
    // Best-effort server-side revocation (clears zd_session cookie).
    try {
      await authService.logout();
    } catch {
      // Ignored - local session is cleared below regardless.
    }

    set({ user: null });
  },

  // Called once on app boot (see src/app/index.tsx). There's no local
  // token to read anymore - the httpOnly cookie (if any) is already
  // attached automatically by the native networking layer.
  hydrate: async () => {
    try {
      const user = await authService.me();

      set({ user, isHydrated: true });
    } catch (e) {
      // No cookie, or an expired/revoked one - fall back to logged-out state.
      set({ user: null, isHydrated: true });
    }
  },
}));
