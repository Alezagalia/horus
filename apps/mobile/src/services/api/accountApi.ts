import { axiosInstance } from '../axios';

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}

export interface FinanceStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: string;
}

export const accountApi = {
  list: async (): Promise<{
    accounts: Account[];
    totalBalanceByCurrency: Record<string, number>;
  }> => {
    const { data } = await axiosInstance.get('/accounts');
    return data;
  },

  getFinanceStats: async (month?: number, year?: number): Promise<FinanceStats> => {
    const { data } = await axiosInstance.get('/finance/stats', { params: { month, year } });
    return {
      month: data.period?.month ?? month ?? new Date().getMonth() + 1,
      year: data.period?.year ?? year ?? new Date().getFullYear(),
      totalIncome: data.totals?.totalIngresos ?? 0,
      totalExpense: data.totals?.totalEgresos ?? 0,
      balance: data.totals?.balance ?? 0,
      currency: data.cuentasResumen?.[0]?.currency ?? 'ARS',
    };
  },
};
