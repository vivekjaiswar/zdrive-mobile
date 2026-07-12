import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppInput from '@/components/Input/AppInput';
import PrimaryButton from '@/components/Button/PrimaryButton';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { getPasswordError, PASSWORD_HINT } from '@/utils/validation';

interface Props {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
}

export default function ChangePasswordModal({
  visible,
  loading = false,
  onCancel,
  onSubmit,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  }

  // Clear stale input whenever the sheet is (re)opened - covers both
  // cancel and "closed automatically after a successful update".
  useEffect(() => {
    if (visible) reset();
  }, [visible]);

  function handleCancel() {
    reset();
    onCancel();
  }

  function handleSubmit() {
    if (!current || !next || !confirm) {
      setError('All fields are required.');
      return;
    }

    // Mirrors ChangePasswordDto's IsStrongPassword rule, verified
    // byte-for-byte against the backend's actual decorator - both
    // sides are enforcing the same policy now (auth.controller.ts's
    // change-password route is correctly typed to ChangePasswordDto).
    const passwordError = getPasswordError(next);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }

    setError(null);
    onSubmit(current, next);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <Text style={styles.title}>Change Password</Text>

            <View style={styles.form}>
              <AppInput
                placeholder="Current Password"
                isPassword
                value={current}
                onChangeText={setCurrent}
              />

              <AppInput
                placeholder="New Password"
                isPassword
                value={next}
                onChangeText={setNext}
              />

              <Text style={styles.hint}>{PASSWORD_HINT}</Text>

              <AppInput
                placeholder="Confirm New Password"
                isPassword
                value={confirm}
                onChangeText={setConfirm}
              />

              {error && <Text style={styles.error}>{error}</Text>}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <View style={styles.confirmButton}>
                <PrimaryButton
                  title="Update"
                  loading={loading}
                  onPress={handleSubmit}
                />
              </View>
            </View>
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
      marginBottom: 16,
    },

    form: {
      gap: 14,
    },

    error: {
      color: colors.danger,
      fontSize: 13,
    },

    hint: {
      marginTop: -8,
      fontSize: 12,
      color: colors.textSecondary,
    },

    actions: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    cancelButton: {
      flex: 1,
      height: 54,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
    },

    cancelText: {
      fontWeight: '700',
      color: colors.textSecondary,
      fontSize: 15,
    },

    confirmButton: {
      flex: 1,
    },
  });
}
