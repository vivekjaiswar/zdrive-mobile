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

  it('correctly stores and differentiates user roles', () => {
    const { setUser } = useAuthStore.getState();
    setUser({ id: '1', email: 'admin@zhdrive.in', plan: 'PRO', role: 'ADMIN' });
    expect(useAuthStore.getState().user?.role).toBe('ADMIN');

    setUser({ id: '2', email: 'user@zhdrive.in', plan: 'FREE', role: 'USER' });
    expect(useAuthStore.getState().user?.role).toBe('USER');
  });
});
