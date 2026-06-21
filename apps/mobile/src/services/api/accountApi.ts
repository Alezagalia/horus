import { axiosInstance } from '../axios';

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
  list: async (): Promise<{
    accounts: Account[];
    totalBalanceByCurrency: Record<string, number>;
  }> => {
    const { data } = await axiosInstance.get('/accounts');
    // El backend expone el saldo como `currentBalance`; el resto de la app lo
    // consume como `balance`. Normalizamos aquí para que coincidan (sin este
    // mapeo, `balance` queda undefined → 0 y el chequeo de saldo del modal de
    // pago deja el botón "Confirmar pago" deshabilitado siempre).
    return {
      ...data,
      accounts: (data.accounts ?? []).map((a: Account & { currentBalance?: number }) => ({
        ...a,
        balance: Number(a.currentBalance ?? a.balance ?? 0),
      })),
    };
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

  create: async (dto: CreateAccountDTO): Promise<Account> => {
    const { data } = await axiosInstance.post('/accounts', dto);
    return data.account ?? data;
  },

  update: async (id: string, dto: UpdateAccountDTO): Promise<Account> => {
    const { data } = await axiosInstance.put(`/accounts/${id}`, dto);
    return data.account ?? data;
  },

  deactivate: async (id: string): Promise<void> => {
    await axiosInstance.put(`/accounts/${id}/deactivate`, {});
  },
};
