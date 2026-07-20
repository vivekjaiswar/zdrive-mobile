import api from './api';
import { AuthSession, TwoFactorSetup } from '@/types/user';

export interface LoginRequest {
  email: string;
  password: string;
}

interface LoginUser {
  id: string;
  email: string;
  plan: string;
  role: string;
}

// v1.2.1: the backend sets the session as an httpOnly cookie (see
// api.ts's withCredentials) and no longer returns the JWT in the body -
// there is no accessToken field to read here anymore.
//
// v1.4.0: login() can now return one of two shapes depending on whether
// the account has 2FA enabled. A 2FA account gets NO session cookie at
// all on this call - only a short-lived challengeToken - and must
// complete verifyTwoFactorLogin() below before a real session exists.
// Check `twoFactorRequired` before touching `.user`.
export type LoginResponse =
  | { twoFactorRequired: true; challengeToken: string }
  | { twoFactorRequired?: undefined; user: LoginUser };

export interface TwoFactorSetupVerifyResponse {
  success: boolean;
  recoveryCodes: string[];
}

// v1.2.1: register() no longer echoes back userId/email (part of the
// anti-enumeration hardening - existing-email and new-email registration
// attempts now return an identical generic response).
export interface RegisterResponse {
  success: boolean;
  message: string;
}

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      data,
    );

    return response.data;
  }

  // Second step of login for a 2FA-enabled account. `code` is either a
  // 6-digit TOTP from the authenticator app or an xxxx-xxxx recovery
  // code - the backend checks both against the same field, so this
  // screen doesn't need to know which kind was entered. Succeeding here
  // is what actually sets the session cookie; the challengeToken alone
  // never does.
  async verifyTwoFactorLogin(
    challengeToken: string,
    code: string,
  ): Promise<{ user: LoginUser }> {
    const { data } = await api.post('/auth/login/2fa', {
      challengeToken,
      code,
    });
    return data;
  }

  // Starts enrollment: generates a new TOTP secret server-side (not
  // enabled yet - verifyTwoFactorSetup below is what flips it on) and
  // returns a ready-to-render QR code alongside the raw secret for
  // authenticator apps that only support manual entry.
  async setupTwoFactor(): Promise<TwoFactorSetup> {
    const { data } = await api.post('/auth/2fa/setup');
    return data;
  }

  // Confirms the user's authenticator is actually working (proves
  // possession of the secret, not just that setup was called) and
  // turns 2FA on. The returned recoveryCodes are shown exactly once -
  // the backend only stores their hashes, so there is no way to
  // retrieve them again after this call.
  async verifyTwoFactorSetup(code: string): Promise<TwoFactorSetupVerifyResponse> {
    const { data } = await api.post('/auth/2fa/verify', { code });
    return data;
  }

  // Requires the account password (not just an active session) since
  // this lowers the account's security bar. The backend also revokes
  // every active session - including this one - as part of disabling,
  // so the caller must log out locally right after this resolves
  // rather than assuming the current session still works.
  async disableTwoFactor(password: string): Promise<{ success: boolean }> {
    const { data } = await api.post('/auth/2fa/disable', { password });
    return data;
  }

  async listSessions(): Promise<AuthSession[]> {
    const { data } = await api.get('/auth/sessions');
    return data;
  }

  // Revoking the session marked `current` (see AuthSession) invalidates
  // the cookie this very request is authenticated with - the caller is
  // responsible for logging out locally right after if that's the one
  // being revoked, same as disableTwoFactor above.
  async revokeSession(id: string): Promise<void> {
    await api.delete(`/auth/sessions/${id}`);
  }

  async me() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  // Bumps the user's tokenVersion server-side so the token being
  // logged out of is actually revoked, not just forgotten locally.
  // Without this, a stolen/leaked token stays valid until its natural
  // 7-day expiry even after the user "logs out."
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  // POST /auth/register: { email, password }. Login is blocked
  // (401 "Please verify your email address") until the account is
  // verified - this does NOT log the user in.
  async register(email: string, password: string): Promise<RegisterResponse> {
    const { data } = await api.post('/auth/register', { email, password });
    return data;
  }

  // The email this sends links to FRONTEND_URL/verify-email?token=...
  // (the web app), not a mobile deep link - this screen exists for
  // users who copy the token out of that link manually.
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/verify-email', { token });
    return data;
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  }

  // Always resolves with success - the backend never reveals whether
  // the email exists, to avoid account enumeration. Don't render a
  // different message based on any field other than the request
  // simply succeeding or failing at the network level.
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  }

  // Same caveat as verifyEmail - token comes from the web reset-
  // password link, pasted in manually here.
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  }
}

export default new AuthService();
