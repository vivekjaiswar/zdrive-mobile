import { useSecurityStore, runWithPickerBypass } from '../store/security.store';

describe('useSecurityStore & picker bypass', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useSecurityStore.setState({
      biometricEnabled: true,
      biometricAvailable: true,
      isHydrated: true,
      isPickerActive: false,
      savedBiometricEmail: null,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('manages picker active state correctly', () => {
    const { setPickerActive } = useSecurityStore.getState();
    expect(useSecurityStore.getState().isPickerActive).toBe(false);

    setPickerActive(true);
    expect(useSecurityStore.getState().isPickerActive).toBe(true);

    setPickerActive(false);
    expect(useSecurityStore.getState().isPickerActive).toBe(false);
  });

  it('runWithPickerBypass activates bypass during execution', async () => {
    let activeDuring = false;

    await runWithPickerBypass(async () => {
      activeDuring = useSecurityStore.getState().isPickerActive;
      return 'picked-asset';
    });

    expect(activeDuring).toBe(true);
  });

  it('saves and clears biometric credentials', async () => {
    const { saveBiometricCredentials, clearBiometricCredentials } = useSecurityStore.getState();

    await saveBiometricCredentials('user@example.com', 'secretPass123');
    expect(useSecurityStore.getState().savedBiometricEmail).toBe('user@example.com');

    await clearBiometricCredentials();
    expect(useSecurityStore.getState().savedBiometricEmail).toBeNull();
  });
});
