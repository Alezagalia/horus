/**
 * Account API Service
 * Sprint 13 - US-119
 */

import { axiosInstance } from '@/lib/axios';
import type { Account, CreateAccountDTO, UpdateAccountDTO, FinanceStats } from '@horus/shared';

/**
 * Get all accounts
 */
export async function getAccounts(): Promise<Account[]> {
  const response = await axiosInstance.get<Account[]>('/accounts');
  return response.data;
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string): Promise<Account> {
  const response = await axiosInstance.get<Account>(`/accounts/${id}`);
  return response.data;
}

/**
 * Create new account
 */
export async function createAccount(data: CreateAccountDTO): Promise<Account> {
  const response = await axiosInstance.post<Account>('/accounts', data);
  return response.data;
}

/**
 * Update account
 */
export async function updateAccount(id: string, data: UpdateAccountDTO): Promise<Account> {
  const response = await axiosInstance.put<Account>(`/accounts/${id}`, data);
  return response.data;
}

/**
 * Deactivate account
 */
export async function deactivateAccount(id: string): Promise<void> {
  await axiosInstance.put(`/accounts/${id}/deactivate`);
}

/**
 * Get finance statistics for a given month/year
 */
export async function getFinanceStats(month?: number, year?: number): Promise<FinanceStats> {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());

  const response = await axiosInstance.get<FinanceStats>(
    `/finance/stats${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
}
