// Offline-first Fase 1: las transacciones se leen/escriben en WatermelonDB
// (src/db/moneyQueries|moneyWrites) y se replican vía /api/replication.
// Este módulo conserva solo los TIPOS del dominio que consume la UI.

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

export interface UpdateTransactionDTO {
  amount?: number;
  concept?: string;
  date?: string;
  notes?: string | null;
  categoryId?: string;
}

export interface CreateTransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  concept: string;
  date: string;
  notes?: string;
}
