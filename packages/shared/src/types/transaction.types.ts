/**
 * Transaction Types
 * Sprint 13 - US-120
 */

import type { Account } from './account.types.js';
import type { Category } from './category.types.js';

export type TransactionType = 'ingreso' | 'egreso';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  concept: string;
  date: string;
  notes: string | null;
  isTransfer: boolean;
  targetAccountId: string | null;
  transferPairId: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations (populated in some responses)
  account?: Account;
  targetAccount?: Account;
  category?: Category;
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

export interface GetTransactionsQuery {
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateTransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  concept: string;
  date: string;
  notes?: string;
}

export interface UpdateTransferDTO {
  amount?: number;
  concept?: string;
  date?: string;
  notes?: string | null;
}

export interface ExpensesByCategory {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  transactionCount: number;
}

export interface ExpensesByCategoryResponse {
  month: number;
  year: number;
  categories: ExpensesByCategory[];
  total: number;
}
