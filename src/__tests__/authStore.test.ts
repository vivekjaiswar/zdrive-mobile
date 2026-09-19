import { useAuthStore } from '../store/auth.store';

describe('useAuthStore', () => {
  it('initializes with unhydrated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isHydrated).toBe(false);
  });

  it('handles user logout correctly', async () => {
    const { logout } = useAuthStore.getState();
    await logout();
    const updatedState = useAuthStore.getState();
    expect(updatedState.user).toBeNull();
  });
});
