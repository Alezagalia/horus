/**
 * Accounts API Service
 * Sprint 9 - US-078
 *
 * API client for account endpoints
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

export interface Account {
  id: string;
  name: string;
  type: 'efectivo' | 'banco' | 'billetera_digital' | 'tarjeta';
  currency: string;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountWithStats extends Account {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

export interface AccountsResponse {
  accounts: AccountWithStats[];
  totalsByCurrency: Array<{
    currency: string;
    total: number;
    accountCount: number;
  }>;
}

/**
 * Get all accounts for the authenticated user
 */
export const getAccounts = async (): Promise<AccountsResponse> => {
  const response = await apiClient.get<AccountsResponse>('/accounts');
  return response.data;
};

/**
 * Get account by ID
 */
export const getAccountById = async (id: string): Promise<AccountWithStats> => {
  const response = await apiClient.get<AccountWithStats>(`/accounts/${id}`);
  return response.data;
};

/**
 * Create account
 */
export interface CreateAccountInput {
  name: string;
  type: 'efectivo' | 'banco' | 'billetera_digital' | 'tarjeta';
  currency: string;
  initialBalance: number;
  color?: string;
  icon?: string;
}

export const createAccount = async (data: CreateAccountInput): Promise<Account> => {
  const response = await apiClient.post<Account>('/accounts', data);
  return response.data;
};

/**
 * Update account
 */
export interface UpdateAccountInput {
  name?: string;
  color?: string;
  icon?: string;
}

export const updateAccount = async (id: string, data: UpdateAccountInput): Promise<Account> => {
  const response = await apiClient.put<Account>(`/accounts/${id}`, data);
  return response.data;
};

/**
 * Deactivate account (soft delete)
 */
export const deactivateAccount = async (id: string): Promise<void> => {
  await apiClient.delete(`/accounts/${id}`);
};
