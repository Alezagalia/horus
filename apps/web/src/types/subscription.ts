export type Plan = 'FREE' | 'PRO';

export type SubStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

export interface SubscriptionInfo {
  plan: Plan;
  status: SubStatus;
  provider: 'STRIPE' | 'GOOGLE_PLAY' | 'APP_STORE' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

export interface Entitlements {
  plan: Plan;
  limits: { habits: number; goals: number; accounts: number };
  features: {
    calendarSync: boolean;
    nutrition: boolean;
    fitness: boolean;
    advancedStats: boolean;
  };
  subscription: SubscriptionInfo | null;
}
