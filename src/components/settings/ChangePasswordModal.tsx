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
import Colors from '@/theme/colors';

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

    // Mirrors the backend's ChangePasswordDto MinLength(6) - that DTO
    // isn't actually enforced server-side on this route (see
    // users.service.ts changePassword comment), so this client check
    // is the only validation happening today.
    if (next.length < 6) {
      setError('New password must be at least 6 characters.');
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
                secureTextEntry
                value={current}
                onChangeText={setCurrent}
              />

              <AppInput
                placeholder="New Password"
                secureTextEntry
                value={next}
                onChangeText={setNext}
              />

              <AppInput
                placeholder="Confirm New Password"
                secureTextEntry
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },

  keyboardWrap: {
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },

  form: {
    gap: 14,
  },

  error: {
    color: Colors.danger,
    fontSize: 13,
  },

  actions: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },

  cancelText: {
    fontWeight: '700',
    color: Colors.textSecondary,
    fontSize: 16,
  },

  confirmButton: {
    flex: 1,
  },
});
