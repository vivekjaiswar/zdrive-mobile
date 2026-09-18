import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import billingService, { RazorpayOrder, SubscriptionDetails } from '@/services/billing.service';
import RazorpayCheckoutModal from '@/components/settings/RazorpayCheckoutModal';
import { BillingPlan } from '@/types/user';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  visible: boolean;
  currentPlan: string;
  userEmail?: string;
  onClose: () => void;
  onUpgraded: () => void;
}

function calculateDaysLeft(expiresAtIso: string | null): number | null {
  if (!expiresAtIso) return null;
  try {
    const expires = new Date(expiresAtIso).getTime();
    const now = Date.now();
    const diff = expires - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export default function PlansModal({
  visible,
  currentPlan,
  userEmail,
  onClose,
  onUpgraded,
}: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<RazorpayOrder | null>(null);
  const [checkoutPlanName, setCheckoutPlanName] = useState('');

  useEffect(() => {
    if (visible) loadData();
  }, [visible]);

  async function loadData() {
    try {
      setLoading(true);
      const [planList, sub] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription().catch(() => null),
      ]);
      setPlans(planList);
      setSubDetails(sub);
    } catch (e: any) {
      console.error('Failed to load subscription plans:', e?.message ?? 'Unknown error');
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
      Alert.alert('Success', 'Your subscription has been upgraded!');
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

  const daysLeft = calculateDaysLeft(subDetails?.subscriptionExpiresAt ?? null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <BlurView intensity={g.blurIntensity + 15} tint={g.blurTint} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: g.glassFillStrong }]} />

          <View style={styles.sheetContent}>
            {/* Sheet Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.title}>Subscriptions & Billing</Text>
                <Text style={styles.subtitle}>Select a plan to expand your cloud storage.</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={g.text} />
              </Pressable>
            </View>

            {/* Expiry Banner if applicable */}
            {subDetails && daysLeft !== null && (
              <View style={styles.expiryBanner}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={g.accent} />
                <Text style={styles.expiryText}>
                  Current Plan Expiry:{' '}
                  <Text style={{ fontWeight: '800', color: g.accent }}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </Text>
                  {subDetails.subscriptionExpiresAt &&
                    ` (${new Date(subDetails.subscriptionExpiresAt).toLocaleDateString()})`}
                </Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ flex: 1 }}
              contentContainerStyle={styles.scroll}
            >
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={g.accent} />
                </View>
              ) : (
                plans.map((plan) => {
                  const isCurrent = plan.code === currentPlan;
                  const canUpgrade = !isCurrent && plan.price > 0;

                  return (
                    <View
                      key={plan.code}
                      style={[styles.planCard, isCurrent && styles.planCardActive]}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.planInfo}>
                          <View style={styles.nameRow}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            {isCurrent && (
                              <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>CURRENT PLAN</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.planStorage}>{plan.storage} Storage</Text>
                        </View>

                        <Text style={styles.planPrice}>
                          {plan.price === 0 ? 'Free' : `₹${plan.price}/mo`}
                        </Text>
                      </View>

                      {canUpgrade && (
                        <Pressable
                          style={styles.upgradeBtn}
                          disabled={creatingOrderFor === plan.code}
                          onPress={() => handleUpgrade(plan)}
                        >
                          {creatingOrderFor === plan.code ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.upgradeBtnText}>Upgrade to {plan.name}</Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>

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

function getStyles(g: GlassTheme) {
  const cardBg = g.scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.025)';

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    sheetContainer: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: g.glassBorder,
      height: '82%',
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 24,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: g.glassBorder,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: g.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: g.textSecondary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    expiryBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: g.accentSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    expiryText: {
      fontSize: 13,
      color: g.text,
      flex: 1,
    },
    scroll: {
      paddingBottom: 32,
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    planCard: {
      marginBottom: 12,
      padding: 18,
      borderRadius: 22,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    planCardActive: {
      borderWidth: 1.5,
      borderColor: g.accent,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    planInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planName: {
      fontSize: 16,
      fontWeight: '800',
      color: g.text,
    },
    activeTag: {
      backgroundColor: g.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    activeTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: g.accent,
      letterSpacing: 0.5,
    },
    planStorage: {
      marginTop: 4,
      fontSize: 13,
      color: g.textSecondary,
    },
    planPrice: {
      fontSize: 16,
      fontWeight: '800',
      color: g.text,
    },
    upgradeBtn: {
      marginTop: 14,
      backgroundColor: g.accent,
      paddingVertical: 11,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    upgradeBtnText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '700',
    },
  });
}
