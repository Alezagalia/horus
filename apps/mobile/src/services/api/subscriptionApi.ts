import { axiosInstance } from '../axios';

export type Plan = 'FREE' | 'PRO';
export type SubStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

export interface Entitlements {
  plan: Plan;
  limits: { habits: number; goals: number; accounts: number };
  features: {
    calendarSync: boolean;
    nutrition: boolean;
    fitness: boolean;
    advancedStats: boolean;
  };
  subscription: {
    plan: Plan;
    status: SubStatus;
    provider: 'STRIPE' | 'GOOGLE_PLAY' | 'APP_STORE' | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
  } | null;
}

/** What the backend returns from /billing/google/verify (entitlements only). */
export type VerifiedEntitlements = Pick<Entitlements, 'plan' | 'limits' | 'features'>;

export const subscriptionApi = {
  getMine: async (): Promise<Entitlements> => {
    const { data } = await axiosInstance.get('/subscription');
    return data;
  },

  /**
   * Verifies a Google Play purchase server-side. The backend validates the token
   * with the Play Developer API and upserts our Subscription, then returns the
   * refreshed entitlements.
   */
  verifyGooglePurchase: async (
    productId: string,
    purchaseToken: string
  ): Promise<VerifiedEntitlements> => {
    const { data } = await axiosInstance.post('/billing/google/verify', {
      productId,
      purchaseToken,
    });
    return data;
  },
};
