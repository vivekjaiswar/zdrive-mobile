import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import billingService from '@/services/billing.service';
import { PaymentReceipt } from '@/types/user';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PaymentsHistoryModal({ visible, onClose }: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPayments();
    }
  }, [visible]);

  async function loadPayments() {
    setLoading(true);
    try {
      const data = await billingService.getPayments();
      setPayments(data ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number, currency: string) {
    if (currency === 'INR') {
      return `₹${amount}`;
    }
    return `${currency} ${amount}`;
  }

  function getStatusColor(status: string) {
    const s = status.toUpperCase();
    if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') {
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
    }
    if (s === 'PENDING' || s === 'PROCESSING') {
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' };
    }
    return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' };
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <BlurView intensity={g.blurIntensity + 15} tint={g.blurTint} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: g.glassFillStrong }]} />

          <View style={styles.sheetContent}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.title}>Payment History</Text>
                <Text style={styles.subtitle}>View your previous invoices and transactions.</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={g.text} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={g.accent} />
              </View>
            ) : payments.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="receipt-text-outline" size={48} color={g.textFaint} />
                <Text style={styles.emptyTitle}>No Payments Found</Text>
                <Text style={styles.emptySubtitle}>You do not have any past billing records.</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
              >
                {payments.map((receipt) => {
                  const statusInfo = getStatusColor(receipt.status);
                  const dateStr = receipt.createdAt
                    ? new Date(receipt.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '';

                  return (
                    <View key={receipt.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planTitle}>
                            {receipt.planCode ?? 'Subscription Payment'}
                          </Text>
                          <Text style={styles.dateText}>{dateStr}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
                          <Text style={[styles.statusText, { color: statusInfo.text }]}>
                            {receipt.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        <View>
                          <Text style={styles.gatewayLabel}>
                            {receipt.gateway} {receipt.gatewayPaymentId ? `• ${receipt.gatewayPaymentId.slice(-8)}` : ''}
                          </Text>
                        </View>
                        <Text style={styles.amountText}>
                          {formatCurrency(receipt.amount, receipt.currency)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(g: GlassTheme) {
  const isDark = g.blurTint === 'dark';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)';

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '80%',
      minHeight: '45%',
      overflow: 'hidden',
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: g.glassBorder,
    },
    sheetContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      flex: 1,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: g.textFaint,
      opacity: 0.4,
      alignSelf: 'center',
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: g.text,
    },
    subtitle: {
      marginTop: 2,
      fontSize: 13,
      color: g.textSecondary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: g.glassFill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    loadingWrap: {
      paddingVertical: 50,
      alignItems: 'center',
    },
    emptyWrap: {
      paddingVertical: 45,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: g.text,
      marginTop: 12,
    },
    emptySubtitle: {
      fontSize: 13,
      color: g.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    scroll: {
      paddingBottom: 24,
    },
    card: {
      marginBottom: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: g.text,
    },
    dateText: {
      fontSize: 12,
      color: g.textSecondary,
      marginTop: 2,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    cardDivider: {
      height: 1,
      backgroundColor: g.glassBorder,
      marginVertical: 12,
      opacity: 0.5,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gatewayLabel: {
      fontSize: 12.5,
      color: g.textSecondary,
      textTransform: 'capitalize',
    },
    amountText: {
      fontSize: 16,
      fontWeight: '800',
      color: g.text,
    },
  });
}
