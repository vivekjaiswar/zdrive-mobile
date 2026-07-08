// Matches UsersService.profile()/.me() on the backend. Note
// avatarUrl here is already a resolved pre-signed download URL (or
// null) - NOT the raw S3 key that uploadAvatar()'s own response
// returns. Don't try to render that raw key as an image source.
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
  createdAt: string;
}

export interface BillingPlan {
  code: string;
  name: string;
  storage: string;
  price: number;
}
