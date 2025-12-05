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
  const response = await axiosInstance.get<{ accounts: Account[]; totalBalanceByCurrency: Record<string, number> }>('/accounts');
  // Backend returns { accounts: [], totalBalanceByCurrency: {} }
  return response.data.accounts || [];
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string): Promise<Account> {
  const response = await axiosInstance.get<{ account: Account }>(`/accounts/${id}`);
  // Backend returns { account: {...} }
  return response.data.account;
}

/**
 * Create new account
 */
export async function createAccount(data: CreateAccountDTO): Promise<Account> {
  const response = await axiosInstance.post<{ account: Account }>('/accounts', data);
  // Backend returns { account: {...} }
  return response.data.account;
}

/**
 * Update account
 */
export async function updateAccount(id: string, data: UpdateAccountDTO): Promise<Account> {
  const response = await axiosInstance.put<{ account: Account }>(`/accounts/${id}`, data);
  // Backend returns { account: {...} }
  return response.data.account;
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

  // Backend returns a different structure, we need to map it
  interface BackendFinanceStats {
    period: { month: number; year: number };
    totals: { totalIngresos: number; totalEgresos: number; balance: number };
    cuentasResumen: Array<{ currency: string }>;
  }

  const response = await axiosInstance.get<BackendFinanceStats>(
    `/finance/stats${params.toString() ? `?${params.toString()}` : ''}`
  );

  // Map backend response to expected FinanceStats type
  const data = response.data;
  return {
    month: data.period.month,
    year: data.period.year,
    totalIncome: data.totals.totalIngresos,
    totalExpense: data.totals.totalEgresos,
    balance: data.totals.balance,
    currency: (data.cuentasResumen[0]?.currency as FinanceStats['currency']) || 'ARS',
  };
}
