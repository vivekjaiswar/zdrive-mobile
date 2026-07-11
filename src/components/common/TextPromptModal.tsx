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
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export default function TextPromptModal({
  visible,
  title,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [value, setValue] = useState(initialValue);

  // Reset the input each time the modal is (re)opened, otherwise a
  // stale value from the previous file/folder would show up.
  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

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
          {/* Stop backdrop press-through from closing the sheet
              when the user taps inside the card itself. */}
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <Text style={styles.title}>{title}</Text>

            <AppInput
              autoFocus
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              containerStyle={styles.input}
            />

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <View style={styles.confirmButton}>
                <PrimaryButton
                  title={confirmLabel}
                  loading={loading}
                  disabled={!value.trim()}
                  onPress={() => onConfirm(value.trim())}
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
