import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    plan: string;
    role: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
  email: string;
}

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      data,
    );

    return response.data;
  }

  async me() {
    const response = await api.get('/auth/me');
    return response.data;
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
