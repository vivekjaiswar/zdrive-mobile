import api from './api';
import { UserProfile } from '@/types/user';

class UsersService {
  // Deliberately /users/me, not /users/profile - the two backend
  // routes return otherwise-identical shapes, but /users/profile is
  // missing twoFactorEnabled (confirmed by reading users.service.ts on
  // the backend directly - looks like an oversight there, not an
  // intentional split). /users/me has every field this app needs.
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get('/users/me');
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

  // Backend enforces IsStrongPassword() on ChangePasswordDto (typed,
  // not `any` - verified against the actual route). Client-side check
  // in ChangePasswordModal mirrors the same rule to fail fast.
  //
  // v1.2.1: changePassword() still bumps the user's tokenVersion server-
  // side and issues a fresh session, but that session now arrives as a
  // Set-Cookie header on this same response (handled automatically by
  // the native cookie jar - see api.ts's withCredentials) rather than as
  // an accessToken field to persist manually. There is nothing left for
  // the caller to store.
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  }

  // Permanently deletes the account, its files, folders, and shares.
  // Irreversible - the caller is responsible for confirming intent
  // and clearing the local session afterward.
  async deleteAccount(): Promise<void> {
    await api.delete('/users/account');
  }
}

export default new UsersService();
