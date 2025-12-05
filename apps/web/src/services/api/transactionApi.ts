/**
 * Transaction API Service
 * Sprint 13 - US-120
 */

import { axiosInstance } from '@/lib/axios';
import type {
  Transaction,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  GetTransactionsQuery,
  TransactionListResponse,
  CreateTransferDTO,
  UpdateTransferDTO,
} from '@horus/shared';

/**
 * Get all transactions with filters
 */
export async function getTransactions(
  query?: GetTransactionsQuery
): Promise<TransactionListResponse> {
  const params = new URLSearchParams();

  if (query?.accountId) params.append('accountId', query.accountId);
  if (query?.categoryId) params.append('categoryId', query.categoryId);
  if (query?.type) params.append('type', query.type);
  if (query?.from) params.append('from', query.from);
  if (query?.to) params.append('to', query.to);
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.offset) params.append('offset', query.offset.toString());

  const response = await axiosInstance.get<TransactionListResponse>(
    `/transactions${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<Transaction> {
  const response = await axiosInstance.get<{ transaction: Transaction }>(`/transactions/${id}`);
  // Backend returns { transaction: {...} }
  return response.data.transaction;
}

/**
 * Create a new transaction
 */
export async function createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
  const response = await axiosInstance.post<{ transaction: Transaction; account: unknown }>('/transactions', data);
  // Backend returns { transaction: {...}, account: {...} }
  return response.data.transaction;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  id: string,
  data: UpdateTransactionDTO
): Promise<Transaction> {
  const response = await axiosInstance.put<{ transaction: Transaction; account: unknown }>(`/transactions/${id}`, data);
  // Backend returns { transaction: {...}, account: {...} }
  return response.data.transaction;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  await axiosInstance.delete(`/transactions/${id}`);
}

/**
 * Create a transfer between accounts
 */
export async function createTransfer(data: CreateTransferDTO): Promise<Transaction> {
  const response = await axiosInstance.post<Transaction>('/transactions/transfer', data);
  return response.data;
}

/**
 * Update a transfer
 */
export async function updateTransfer(id: string, data: UpdateTransferDTO): Promise<Transaction> {
  const response = await axiosInstance.put<Transaction>(`/transactions/transfer/${id}`, data);
  return response.data;
}
