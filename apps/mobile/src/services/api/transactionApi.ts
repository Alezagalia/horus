import { axiosInstance } from '../axios';

export type TransactionType = 'ingreso' | 'egreso';

export interface TxCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface TxAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  color?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  concept: string;
  date: string;
  notes?: string;
  isTransfer: boolean;
  createdAt: string;
  account: TxAccount;
  category: TxCategory;
}

export interface TransactionListResult {
  transactions: Transaction[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
  totals: { totalIncome: number; totalExpenses: number; balance: number };
}

export interface CreateTransactionDTO {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  concept: string;
  date: string;
  notes?: string;
}

export const transactionApi = {
  list: async (filters?: {
    accountId?: string;
    type?: TransactionType;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<TransactionListResult> => {
    const { data } = await axiosInstance.get('/transactions', { params: filters });
    return data;
  },

  create: async (dto: CreateTransactionDTO): Promise<Transaction> => {
    const { data } = await axiosInstance.post('/transactions', dto);
    return data.transaction ?? data;
  },

  delete: async (transactionId: string): Promise<void> => {
    await axiosInstance.delete(`/transactions/${transactionId}`);
  },

  listCategories: async (scope?: string): Promise<TxCategory[]> => {
    const { data } = await axiosInstance.get('/categories', {
      params: scope ? { scope } : undefined,
    });
    return data.categories ?? data;
  },
};
