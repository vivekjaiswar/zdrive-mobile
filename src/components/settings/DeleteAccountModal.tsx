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
  const colors = useColors();
  const styles = getStyles(colors);
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
      marginBottom: 12,
    },

    warning: {
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.textSecondary,
      marginBottom: 20,
    },

    label: {
      fontSize: 13.5,
      color: colors.text,
      marginBottom: 8,
    },

    labelStrong: {
      fontWeight: '700',
      color: colors.danger,
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
