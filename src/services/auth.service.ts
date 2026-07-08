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
}

export default new AuthService();