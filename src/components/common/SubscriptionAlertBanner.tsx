import { useState, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import billingService, { SubscriptionDetails } from '@/services/billing.service';

interface Props {
  onRenew?: () => void;
  thresholdDays?: number;
  expiresAt?: string | null;
  planName?: string;
}

export default function SubscriptionAlertBanner({
  onRenew,
  thresholdDays = 7,
  expiresAt,
  planName,
}: Props) {
  const g = useGlass();
  const styles = getStyles(g);
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    // If not provided in props or user store, fetch live subscription status
    if (expiresAt === undefined && !user?.subscriptionExpiresAt) {
      let active = true;
      billingService
        .getSubscription()
        .then((data) => {
          if (active && data) {
            setSubDetails(data);
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }
  }, [expiresAt, user?.subscriptionExpiresAt]);

  const effectiveExpiresAt = expiresAt ?? user?.subscriptionExpiresAt ?? subDetails?.subscriptionExpiresAt;
  const effectivePlan = planName ?? subDetails?.plan ?? user?.plan ?? 'storage';

  const expiryInfo = useMemo(() => {
    if (!effectiveExpiresAt) return null;

    try {
      const expires = new Date(effectiveExpiresAt).getTime();
      const now = Date.now();
      const diffMs = expires - now;
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const isExpired = daysLeft <= 0;
      const isExpiringSoon = daysLeft <= thresholdDays;

      if (!isExpired && !isExpiringSoon) return null;

      return {
        daysLeft,
        isExpired,
        expiresDate: new Date(effectiveExpiresAt).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        }),
      };
    } catch {
      return null;
    }
  }, [effectiveExpiresAt, thresholdDays]);

  if (!expiryInfo || dismissed) return null;

  const { daysLeft, isExpired, expiresDate } = expiryInfo;

  return (
    <View style={[styles.container, isExpired ? styles.bgExpired : styles.bgWarning]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={isExpired ? 'alert-octagon' : 'clock-alert-outline'}
          size={18}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {isExpired
            ? 'Subscription Expired'
            : daysLeft === 1
              ? 'Plan Expires Tomorrow'
              : `Plan Expires in ${daysLeft} Days (${expiresDate})`}
        </Text>
        <Text style={styles.subtitle}>
          {isExpired
            ? 'Cloud uploads are paused. Renew to resume unlimited storage.'
            : `Renew your ${effectivePlan} plan to maintain uninterrupted uploads.`}
        </Text>
      </View>

      <View style={styles.actions}>
        {onRenew && (
          <Pressable style={styles.renewBtn} onPress={onRenew} hitSlop={6}>
            <Text style={styles.renewBtnText}>Renew</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.closeBtn}
          onPress={() => setDismissed(true)}
          hitSlop={10}
          accessibilityLabel="Dismiss notification"
        >
          <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    bgWarning: {
      backgroundColor: '#D97706',
    },
    bgExpired: {
      backgroundColor: '#DC2626',
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    textWrap: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: 'rgba(255, 255, 255, 0.92)',
      marginTop: 2,
      lineHeight: 15,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    renewBtn: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    renewBtnText: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: '#B45309',
    },
    closeBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
