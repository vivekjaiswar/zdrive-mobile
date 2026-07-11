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

  async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock ZDrive',
      cancelLabel: 'Cancel',
      // Let the OS fall back to the device passcode (e.g. Face ID
      // temporarily unreadable) rather than dead-ending the user with
      // no way back into their own app.
      disableDeviceFallback: false,
    });

    return result.success;
  }
}

export default new BiometricService();
