import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import AppInput from '@/components/Input/AppInput';
import PrimaryButton from '@/components/Button/PrimaryButton';
import authService from '@/services/auth.service';
import { TwoFactorSetup } from '@/types/user';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  visible: boolean;
  enabled: boolean;
  // Called after a successful enable OR disable - either way the
  // Settings screen needs to re-fetch the profile to pick up the new
  // twoFactorEnabled value.
  onChanged: () => void;
  // Disabling 2FA revokes every session on the backend, including the
  // one making this call - the caller must log the user out locally
  // right after this fires, same as any other session-killing action.
  onDisabledLoggedOut: () => void;
  onClose: () => void;
}

type Step = 'intro' | 'qr' | 'verify' | 'recovery' | 'disable';

export default function TwoFactorModal({
  visible,
  enabled,
  onChanged,
  onDisabledLoggedOut,
  onClose,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible) {
      setStep(enabled ? 'disable' : 'qr');
      setCode('');
      setPassword('');
      setSetup(null);
      setRecoveryCodes([]);
      if (!enabled) loadSetup();
    }
  }, [visible, enabled]);

  async function loadSetup() {
    try {
      setLoading(true);
      const data = await authService.setupTwoFactor();
      setSetup(data);
    } catch (error: any) {
      Alert.alert(
        'Setup Failed',
        error?.response?.data?.message ?? 'Could not start 2FA setup.',
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) {
      Alert.alert('Validation', 'Enter the 6-digit code from your app.');
      return;
    }

    try {
      setLoading(true);
      const { recoveryCodes: codes } = await authService.verifyTwoFactorSetup(
        code.trim(),
      );
      setRecoveryCodes(codes);
      setStep('recovery');
    } catch (error: any) {
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message ?? 'That code was not accepted.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    onChanged();
    onClose();
  }

  async function handleCopyRecoveryCodes() {
    await Clipboard.setStringAsync(recoveryCodes.join('\n'));
    Alert.alert('Copied', 'Recovery codes copied to clipboard.');
  }

  async function handleDisable() {
    if (!password.trim()) {
      Alert.alert('Validation', 'Enter your account password to continue.');
      return;
    }

    try {
      setLoading(true);
      await authService.disableTwoFactor(password);

      // The backend revokes every session as part of disabling 2FA
      // (a lower security bar shouldn't let an old token keep working
      // under it) - this device's own session is now dead too, so the
      // caller has to treat this exactly like a forced logout, not a
      // simple "close the modal and refresh" success.
      onDisabledLoggedOut();
    } catch (error: any) {
      Alert.alert(
        'Could Not Disable',
        error?.response?.data?.message ?? 'Check your password and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {step === 'disable' && (
                <>
                  <Text style={styles.title}>Disable Two-Factor Authentication</Text>
                  <Text style={styles.subtitle}>
                    This removes the extra login step and signs you out of
                    every device, including this one - you'll need to log
                    back in afterward.
                  </Text>

                  <AppInput
                    isPassword
                    autoFocus
                    placeholder="Account password"
                    value={password}
                    onChangeText={setPassword}
                    containerStyle={styles.input}
                  />

                  <PrimaryButton
                    title="Disable 2FA"
                    variant="danger"
                    loading={loading}
                    onPress={handleDisable}
                  />
                </>
              )}

              {step === 'qr' && (
                <>
                  <Text style={styles.title}>Set Up Two-Factor Authentication</Text>
                  <Text style={styles.subtitle}>
                    Scan this code with an authenticator app (Google
                    Authenticator, Authy, etc.), or enter the key manually.
                  </Text>

                  {setup && (
                    <>
                      <Image
                        source={{ uri: setup.qrCodeDataUrl }}
                        style={styles.qr}
                        resizeMode="contain"
                      />

                      <Pressable
                        onPress={async () => {
                          await Clipboard.setStringAsync(setup.secret);
                          Alert.alert('Copied', 'Secret key copied to clipboard.');
                        }}
                      >
                        <Text style={styles.secret}>{setup.secret}</Text>
                        <Text style={styles.secretHint}>Tap to copy</Text>
                      </Pressable>
                    </>
                  )}

                  <PrimaryButton
                    title="Next"
                    disabled={!setup}
                    loading={loading && !setup}
                    onPress={() => setStep('verify')}
                  />
                </>
              )}

              {step === 'verify' && (
                <>
                  <Text style={styles.title}>Enter the Code</Text>
                  <Text style={styles.subtitle}>
                    Enter the 6-digit code your authenticator app is showing
                    now, to confirm it's set up correctly.
                  </Text>

                  <AppInput
                    autoFocus
                    keyboardType="number-pad"
                    placeholder="123456"
                    value={code}
                    onChangeText={setCode}
                    containerStyle={styles.input}
                  />

                  <PrimaryButton
                    title="Verify & Enable"
                    loading={loading}
                    onPress={handleVerify}
                  />
                </>
              )}

              {step === 'recovery' && (
                <>
                  <Text style={styles.title}>Save Your Recovery Codes</Text>
                  <Text style={styles.subtitle}>
                    Each code can be used once to log in if you lose access to
                    your authenticator app. Save these somewhere safe - they
                    won't be shown again.
                  </Text>

                  <View style={styles.recoveryBox}>
                    {recoveryCodes.map((rc) => (
                      <Text key={rc} style={styles.recoveryCode}>
                        {rc}
                      </Text>
                    ))}
                  </View>

                  <Pressable style={styles.copyRow} onPress={handleCopyRecoveryCodes}>
                    <Text style={styles.copyText}>Copy All</Text>
                  </Pressable>

                  <PrimaryButton title="Done" onPress={handleDone} />
                </>
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(8, 12, 22, 0.5)',
      justifyContent: 'flex-end',
    },

    keyboardWrap: {
      justifyContent: 'flex-end',
    },

    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 32,
      maxHeight: '85%',
    },

    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: 20,
    },

    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },

    subtitle: {
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 20,
    },

    input: {
      marginBottom: 20,
    },

    qr: {
      width: 220,
      height: 220,
      alignSelf: 'center',
      marginBottom: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
    },

    secret: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 1,
    },

    secretHint: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 20,
    },

    recoveryBox: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },

    recoveryCode: {
      fontSize: 14.5,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: 0.5,
      marginBottom: 6,
    },

    copyRow: {
      alignItems: 'center',
      marginBottom: 20,
    },

    copyText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14.5,
    },
  });
}
