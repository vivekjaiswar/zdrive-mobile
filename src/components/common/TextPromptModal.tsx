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
