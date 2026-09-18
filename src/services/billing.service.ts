import api from './api';
import { BillingPlan } from '@/types/user';

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface SubscriptionDetails {
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  storageLimit: string;
}

class BillingService {
  async getPlans(): Promise<BillingPlan[]> {
    const { data } = await api.get('/billing/plans');
    return data;
  }

  async getSubscription(): Promise<SubscriptionDetails> {
    const { data } = await api.get('/billing/subscription');
    return data;
  }

  async createRazorpayOrder(planCode: string): Promise<RazorpayOrder> {
    const { data } = await api.post('/billing/razorpay/create-order', {
      planCode,
    });
    return data;
  }

  async verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<{ success: boolean }> {
    const { data } = await api.post('/billing/razorpay/verify', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return data;
  }
}

export default new BillingService();
