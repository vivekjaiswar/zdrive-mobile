// Matches UsersService.me() on the backend (users.service.ts fetches
// from /users/me, not /users/profile - see auth.service.ts for why:
// /users/profile is missing twoFactorEnabled, a backend inconsistency
// between the two near-identical endpoints). avatarUrl here is already
// a resolved pre-signed download URL (or null) - NOT the raw S3 key
// that uploadAvatar()'s own response returns. Don't try to render that
// raw key as an image source.
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  storageUsed: string;
  storageLimit: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface BillingPlan {
  code: string;
  name: string;
  storage: string;
  price: number;
}

// GET /auth/sessions - one row per still-valid (not revoked, not
// expired) login. `current` marks whichever session's jti matches the
// cookie this very request came in on, so the UI can hide/guard the
// revoke action for the session actively viewing this screen.
export interface AuthSession {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

// POST /auth/2fa/setup response - qrCodeDataUrl is already a rendered
// `data:image/png;base64,...` URI generated server-side, so it can be
// handed straight to <Image source={{ uri }} /> with no client-side QR
// library needed. secret/otpauthUrl are shown as a manual-entry
// fallback for authenticator apps that can't scan a code.
export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}
