/**
 * Transactions API Service
 * Sprint 9 - US-S9-008
 *
 * API client for transaction endpoints
 */

import axios from 'axios';

// API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// TODO: Add auth interceptor when authentication is implemented

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
  notes?: string;
  isTransfer: boolean;
  targetAccountId?: string;
  transferPairId?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  account?: {
    id: string;
    name: string;
    type: string;
    currency: string;
  };
  targetAccount?: {
    id: string;
    name: string;
  };
}

export interface GetTransactionsParams {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get all transactions with filters and pagination
 */
export const getTransactions = async (
  params?: GetTransactionsParams
): Promise<TransactionsResponse> => {
  const response = await apiClient.get<TransactionsResponse>('/transactions', {
    params,
  });
  return response.data;
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id: string): Promise<Transaction> => {
  const response = await apiClient.get<{ transaction: Transaction }>(`/transactions/${id}`);
  return response.data.transaction;
};

/**
 * Get transactions for a specific account
 */
export const getAccountTransactions = async (
  accountId: string,
  params?: Omit<GetTransactionsParams, 'accountId'>
): Promise<TransactionsResponse> => {
  const response = await apiClient.get<TransactionsResponse>('/transactions', {
    params: {
      ...params,
      accountId,
    },
  });
  return response.data;
};

/**
 * Create transaction (ingreso or egreso)
 */
export interface CreateTransactionInput {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  concept: string;
  date: string;
  notes?: string;
}

export const createTransaction = async (data: CreateTransactionInput): Promise<Transaction> => {
  const response = await apiClient.post<Transaction>('/transactions', data);
  return response.data;
};

/**
 * Update transaction
 */
export interface UpdateTransactionInput {
  amount?: number;
  categoryId?: string;
  concept?: string;
  date?: string;
  notes?: string;
}

export const updateTransaction = async (
  id: string,
  data: UpdateTransactionInput
): Promise<Transaction> => {
  const response = await apiClient.put<Transaction>(`/transactions/${id}`, data);
  return response.data;
};

/**
 * Delete transaction
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  await apiClient.delete(`/transactions/${id}`);
};

/**
 * Create transfer between accounts
 */
export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  concept: string;
  date: string;
  notes?: string;
}

export interface TransferResult {
  egresoTransaction: Transaction;
  ingresoTransaction: Transaction;
}

export const createTransfer = async (data: CreateTransferInput): Promise<TransferResult> => {
  const response = await apiClient.post<TransferResult>('/transactions/transfer', data);
  return response.data;
};

/**
 * Update transfer (updates both linked transactions)
 */
export interface UpdateTransferInput {
  amount?: number;
  concept?: string;
  date?: string;
  notes?: string;
}

export const updateTransfer = async (
  id: string,
  data: UpdateTransferInput
): Promise<TransferResult> => {
  const response = await apiClient.put<TransferResult>(`/transactions/transfer/${id}`, data);
  return response.data;
};
