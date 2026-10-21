import * as LocalAuthentication from 'expo-local-authentication';

class BiometricService {
  // True only if the device both has biometric hardware AND has at
  // least one biometric (Face ID/fingerprint) actually enrolled -
  // hardware presence alone isn't enough. An unenrolled device can
  // never pass authenticateAsync(), so it shouldn't be offered the
  // Settings toggle or be subject to the lock screen at all.
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    return LocalAuthentication.isEnrolledAsync();
  }

  async getBiometricTypeName(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      }
      return 'Biometrics';
    } catch {
      return 'Biometrics';
    }
  }

  async authenticate(promptMessage = 'Unlock OJI Drive'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        // Let the OS fall back to the device passcode (e.g. Face ID
        // temporarily unreadable) rather than dead-ending the user with
        // no way back into their own app.
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      return false;
    }
  }
}

export default new BiometricService();
