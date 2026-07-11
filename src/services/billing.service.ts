import api from './api';
import { BillingPlan } from '@/types/user';

class BillingService {
  // GET /billing/plans is public/read-only - safe to call.
  //
  // Deliberately NOT implementing changePlan/activate/suspend here:
  // as of the latest backend review those endpoints are correctly
  // gated behind JwtGuard + AdminGuard (a regular user's token gets
  // 403'd), but they're admin/ops tools, not a self-service upgrade
  // path - a real user calling them would just get rejected. The
  // actual upgrade flow is meant to run purchase -> WHMCS webhook ->
  // changePlan server-to-server once WHMCS is integrated. Revisit
  // this once that exists and there's a real "Upgrade" flow to wire
  // up (likely a checkout redirect, not a direct call to this route).
  async getPlans(): Promise<BillingPlan[]> {
    const { data } = await api.get('/billing/plans');
    return data;
  }
}

export default new BillingService();
