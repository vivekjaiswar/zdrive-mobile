import api from './api';
import { BillingPlan } from '@/types/user';

class BillingService {
  // GET /billing/plans is public/read-only - safe to call.
  //
  // Deliberately NOT implementing changePlan/activate/suspend here:
  // those backend endpoints (POST /billing/change-plan, /activate,
  // /suspend) have no auth guard at all - any client can call them
  // with an arbitrary userId and grant themselves any plan for free.
  // Wiring a mobile "Upgrade" button to them would just be a nicer
  // front door onto that hole. Fix the backend guard first.
  async getPlans(): Promise<BillingPlan[]> {
    const { data } = await api.get('/billing/plans');
    return data;
  }
}

export default new BillingService();
