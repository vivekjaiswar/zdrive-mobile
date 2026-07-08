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
import Colors from '@/theme/colors';

interface Props {
  visible: boolean;
  currentPlan: string;
  onClose: () => void;
}

export default function PlansModal({ visible, currentPlan, onClose }: Props) {
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
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 32 }} />
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
                    size={22}
                    color={plan.code === currentPlan ? Colors.primary : '#CBD5E1'}
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: '#F8FAFC',
  },

  planRowActive: {
    backgroundColor: '#EEF5FF',
  },

  planIcon: {
    width: 22,
  },

  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },

  planStorage: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  planPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },

  closeButton: {
    marginTop: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },

  closeText: {
    fontWeight: '700',
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
