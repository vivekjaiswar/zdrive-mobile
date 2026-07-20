import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import billingService, { RazorpayOrder } from '@/services/billing.service';
import RazorpayCheckoutModal from '@/components/settings/RazorpayCheckoutModal';
import { BillingPlan } from '@/types/user';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  visible: boolean;
  currentPlan: string;
  userEmail?: string;
  onClose: () => void;
  // Called after a payment actually verifies - the caller should
  // re-fetch the profile to pick up the new plan/storage limit.
  onUpgraded: () => void;
}

export default function PlansModal({
  visible,
  currentPlan,
  userEmail,
  onClose,
  onUpgraded,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<RazorpayOrder | null>(null);
  const [checkoutPlanName, setCheckoutPlanName] = useState('');

  useEffect(() => {
    if (visible) loadPlans();
  }, [visible]);

  async function loadPlans() {
    try {
      setLoading(true);
      const data = await billingService.getPlans();
      setPlans(data);
    } catch (e: any) {
      console.error('Failed to load plans:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: BillingPlan) {
    try {
      setCreatingOrderFor(plan.code);
      const order = await billingService.createRazorpayOrder(plan.code);
      setCheckoutPlanName(plan.name);
      setCheckoutOrder(order);
    } catch (error: any) {
      Alert.alert(
        'Could Not Start Checkout',
        error?.response?.data?.message ?? 'Please try again in a moment.',
      );
    } finally {
      setCreatingOrderFor(null);
    }
  }

  async function handlePaymentSuccess(
    paymentId: string,
    orderId: string,
    signature: string,
  ) {
    setCheckoutOrder(null);

    try {
      await billingService.verifyRazorpayPayment(orderId, paymentId, signature);
      Alert.alert('Success', 'Your plan has been upgraded.');
      onUpgraded();
      onClose();
    } catch (error: any) {
      Alert.alert(
        'Payment Received, Verification Failed',
        error?.response?.data?.message ??
          "Your payment went through but we couldn't confirm it automatically. Contact support if your plan doesn't update shortly.",
      );
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.title}>Plans</Text>
          <Text style={styles.subtitle}>
            Upgrade anytime - paid plans are billed once per 30-day cycle.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
          ) : (
            plans.map((plan) => {
              const isCurrent = plan.code === currentPlan;
              const canUpgrade = !isCurrent && plan.price > 0;

              return (
                <View
                  key={plan.code}
                  style={[styles.planRow, isCurrent && styles.planRowActive]}
                >
                  <View style={styles.planIcon}>
                    <MaterialCommunityIcons
                      name={isCurrent ? 'check-circle' : 'circle-outline'}
                      size={20}
                      color={isCurrent ? colors.primary : colors.textSecondary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planStorage}>{plan.storage}</Text>
                  </View>

                  {canUpgrade ? (
                    <Pressable
                      style={styles.upgradeButton}
                      disabled={creatingOrderFor === plan.code}
                      onPress={() => handleUpgrade(plan)}
                    >
                      {creatingOrderFor === plan.code ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.upgradeText}>₹{plan.price}/mo</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Text style={styles.planPrice}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
                    </Text>
                  )}
                </View>
              );
            })
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>

      <RazorpayCheckoutModal
        visible={!!checkoutOrder}
        order={checkoutOrder}
        planName={checkoutPlanName}
        userEmail={userEmail}
        onSuccess={handlePaymentSuccess}
        onDismiss={() => setCheckoutOrder(null)}
      />
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

    upgradeButton: {
      minWidth: 88,
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    upgradeText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
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
