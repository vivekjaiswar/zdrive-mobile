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
  initialGstin?: string | null;
  initialBillingState?: string | null;
  onCancel: () => void;
  onSubmit: (gstin: string, billingState: string) => void;
}

export default function BillingDetailsModal({
  visible,
  loading = false,
  initialGstin,
  initialBillingState,
  onCancel,
  onSubmit,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const [gstin, setGstin] = useState('');
  const [billingState, setBillingState] = useState('');

  useEffect(() => {
    if (visible) {
      setGstin(initialGstin ?? '');
      setBillingState(initialBillingState ?? '');
    }
  }, [visible, initialGstin, initialBillingState]);

  function handleSubmit() {
    onSubmit(gstin.trim(), billingState.trim());
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Tax & Billing Details</Text>
          <Text style={styles.description}>
            Add GSTIN and state for tax invoices and business receipts.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>GSTIN (Optional)</Text>
            <AppInput
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={gstin}
              autoCapitalize="characters"
              onChangeText={setGstin}
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Billing State (Optional)</Text>
            <AppInput
              placeholder="e.g. Maharashtra"
              value={billingState}
              onChangeText={setBillingState}
              editable={!loading}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              disabled={loading}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <View style={styles.confirmButton}>
              <PrimaryButton
                title="Save"
                loading={loading}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      gap: 14,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 4,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
    },
  });
}
