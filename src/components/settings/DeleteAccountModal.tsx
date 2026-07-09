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
  onConfirm: () => void;
}

const CONFIRM_WORD = 'DELETE';

// Deliberately not a plain Alert.alert with OK/Cancel - this action
// is permanent (deletes the user row, all files, folders, and
// shares server-side) and can't be undone, so it needs real friction
// beyond a single tap.
export default function DeleteAccountModal({
  visible,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setValue('');
    }
  }, [visible]);

  const canConfirm = value.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <Text style={styles.title}>Delete Account</Text>

            <Text style={styles.warning}>
              This permanently deletes your account, every file and folder you
              own, and all active share links. This cannot be undone.
            </Text>

            <Text style={styles.label}>
              Type <Text style={styles.labelStrong}>{CONFIRM_WORD}</Text> to confirm
            </Text>

            <AppInput
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              value={value}
              onChangeText={setValue}
              placeholder={CONFIRM_WORD}
              containerStyle={styles.input}
            />

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <View style={styles.confirmButton}>
                <PrimaryButton
                  title="Delete Forever"
                  variant="danger"
                  loading={loading}
                  disabled={!canConfirm}
                  onPress={onConfirm}
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
    marginBottom: 12,
  },

  warning: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },

  labelStrong: {
    fontWeight: '700',
    color: '#DC2626',
  },

  input: {
    marginBottom: 24,
  },

  actions: {
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
