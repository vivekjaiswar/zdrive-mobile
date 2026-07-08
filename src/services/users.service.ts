import api from './api';
import { UserProfile } from '@/types/user';

class UsersService {
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get('/users/profile');
    return data;
  }

  async updateProfile(name: string): Promise<void> {
    await api.patch('/users/profile', { name });
  }

  // POST /users/avatar returns { success, avatarUrl } where
  // avatarUrl is the raw S3 key, not a usable image URL - re-fetch
  // the profile afterward to get a real pre-signed URL to render.
  async uploadAvatar(
    uri: string,
    name: string,
    mimeType: string,
  ): Promise<void> {
    const form = new FormData();

    form.append('file', {
      uri,
      name,
      type: mimeType,
    } as any);

    await api.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // Note: the backend's ChangePasswordDto (class-validator) exists
  // but auth.controller.ts's change-password route takes @Body()
  // body: any, so there's no server-side validation on this beyond
  // whatever authService.changePassword() checks manually. Validate
  // client-side defensively - see ChangePasswordModal.
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
}

export default new UsersService();
