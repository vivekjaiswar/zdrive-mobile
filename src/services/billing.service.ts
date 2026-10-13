import api from './api';
import { BillingPlan, PaymentReceipt } from '@/types/user';

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
  async getPlans(audience?: 'INDIVIDUAL' | 'BUSINESS'): Promise<BillingPlan[]> {
    const url = audience ? `/billing/plans?audience=${audience}` : '/billing/plans';
    const { data } = await api.get(url);
    return data;
  }

  async getSubscription(): Promise<SubscriptionDetails> {
    const { data } = await api.get('/billing/subscription');
    return data;
  }

  async getPayments(): Promise<PaymentReceipt[]> {
    const { data } = await api.get('/billing/payments');
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
