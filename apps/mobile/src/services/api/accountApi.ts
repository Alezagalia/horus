import { axiosInstance } from '../axios';

// Offline-first Fase 1: el CRUD de cuentas va a WatermelonDB
// (src/db/moneyQueries|moneyWrites) y se replica vía /api/replication.
// Acá quedan los tipos/constantes y getFinanceStats (analytics, online).

export type AccountType = 'efectivo' | 'banco' | 'billetera_digital' | 'tarjeta';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  efectivo: 'Efectivo',
  banco: 'Banco',
  billetera_digital: 'Billetera Digital',
  tarjeta: 'Tarjeta',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  efectivo: '💵',
  banco: '🏦',
  billetera_digital: '📱',
  tarjeta: '💳',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  efectivo: '#10B981',
  banco: '#3B82F6',
  billetera_digital: '#8B5CF6',
  tarjeta: '#F59E0B',
};

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance?: number;
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

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  color?: string;
}

export interface UpdateAccountDTO {
  name?: string;
  currency?: string;
  initialBalance?: number;
}

export const accountApi = {
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
