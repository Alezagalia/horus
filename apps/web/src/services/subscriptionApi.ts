import { axiosInstance } from '@/lib/axios';
import type { Entitlements } from '@/types/subscription';

export const subscriptionApi = {
  async getMine(): Promise<Entitlements> {
    const { data } = await axiosInstance.get<Entitlements>('/subscription');
    return data;
  },

  /** Starts a Lemon Squeezy checkout and returns the hosted checkout URL. */
  async createCheckout(interval: 'monthly' | 'annual'): Promise<{ url: string }> {
    const { data } = await axiosInstance.post<{ url: string }>('/billing/checkout', { interval });
    return data;
  },
};
