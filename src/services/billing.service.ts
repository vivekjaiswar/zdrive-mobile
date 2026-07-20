import api from './api';
import { BillingPlan } from '@/types/user';

export interface RazorpayOrder {
  orderId: string;
  // Paise, not rupees - Razorpay's checkout script wants the smallest
  // currency unit, same as the backend's own order.create() call.
  amount: number;
  currency: string;
  // Razorpay's publishable key_id - safe to expose client-side (it's
  // meant to be embedded in the checkout script), NOT the key_secret.
  keyId: string;
}

class BillingService {
  // GET /billing/plans is public/read-only - safe to call.
  async getPlans(): Promise<BillingPlan[]> {
    const { data } = await api.get('/billing/plans');
    return data;
  }

  // v1.4.0: self-service upgrades now exist via Razorpay Standard
  // Checkout (changePlan/activate/suspend remain admin-only - this is
  // the actual user-facing path). Creates a pending Payment row
  // server-side and returns what the checkout script needs to open.
  async createRazorpayOrder(planCode: string): Promise<RazorpayOrder> {
    const { data } = await api.post('/billing/razorpay/create-order', {
      planCode,
    });
    return data;
  }

  // Confirms the payment signature and applies the plan change. There's
  // also a server-to-server webhook that can do this independently if
  // the user closes the app before this call fires, but this is what
  // gives the plan change immediately rather than waiting on that.
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
