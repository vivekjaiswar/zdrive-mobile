import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import billingService from '@/services/billing.service';
import { BillingPlan } from '@/types/user';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  visible: boolean;
  currentPlan: string;
  onClose: () => void;
}

export default function PlansModal({ visible, currentPlan, onClose }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) loadPlans();
  }, [visible]);

  async function loadPlans() {
    try {
      setLoading(true);
      const data = await billingService.getPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.title}>Plans</Text>
          <Text style={styles.subtitle}>
            To change plans, contact support - upgrades aren't
            self-service in the app yet.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
          ) : (
            plans.map((plan) => (
              <View
                key={plan.code}
                style={[
                  styles.planRow,
                  plan.code === currentPlan && styles.planRowActive,
                ]}
              >
                <View style={styles.planIcon}>
                  <MaterialCommunityIcons
                    name={plan.code === currentPlan ? 'check-circle' : 'circle-outline'}
                    size={20}
                    color={plan.code === currentPlan ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planStorage}>{plan.storage}</Text>
                </View>

                <Text style={styles.planPrice}>
                  {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
                </Text>
              </View>
            ))
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
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
    },

    subtitle: {
      marginTop: 6,
      fontSize: 12.5,
      color: colors.textSecondary,
      marginBottom: 16,
    },

    planRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginBottom: 10,
      backgroundColor: colors.surfaceAlt,
    },

    planRowActive: {
      backgroundColor: colors.primarySoft,
    },

    planIcon: {
      width: 20,
    },

    planName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },

    planStorage: {
      marginTop: 2,
      fontSize: 12.5,
      color: colors.textSecondary,
    },

    planPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    closeButton: {
      marginTop: 8,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
    },

    closeText: {
      fontWeight: '700',
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
}
