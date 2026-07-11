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
  // but auth.controller.ts's change-password route was last seen
  // typed as @Body() body: any, so server-side enforcement of the
  // password policy on THIS route is unconfirmed. Validate
  // client-side defensively - see ChangePasswordModal.
  //
  // changePassword() on the backend bumps the user's tokenVersion
  // (so old tokens everywhere else get revoked) and returns a fresh
  // accessToken reflecting the new version. The caller MUST persist
  // this immediately - if it doesn't, the app keeps using the now-
  // stale token and gets silently logged out on the very next
  // unrelated API call.
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ accessToken: string }> {
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
