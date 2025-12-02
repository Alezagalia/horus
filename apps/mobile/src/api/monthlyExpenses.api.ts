/**
 * Monthly Expenses API Service
 * Sprint 10 - US-090
 *
 * API client for monthly expense instances endpoints
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

export type ExpenseStatus = 'pendiente' | 'pagado';

/**
 * Monthly Expense Instance
 */
export interface MonthlyExpenseInstance {
  id: string;
  recurringExpenseId: string;
  userId: string;
  month: number;
  year: number;
  concept: string;
  categoryId: string;
  amount: number;
  previousAmount: number | null;
  status: ExpenseStatus;
  accountId: string | null;
  paidDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  recurringExpense?: {
    id: string;
    concept: string;
    currency: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  account?: {
    id: string;
    name: string;
    icon?: string;
  };
}

/**
 * Query parameters for GET /monthly-expenses
 */
export interface GetMonthlyExpensesParams {
  status?: ExpenseStatus;
}

/**
 * Response from GET /monthly-expenses
 */
export interface MonthlyExpensesResponse {
  message: string;
  monthlyExpenses: MonthlyExpenseInstance[];
  count: number;
  month: number;
  year: number;
}

/**
 * Get monthly expense instances for a specific month/year
 */
export const getMonthlyExpenses = async (
  month: number,
  year: number,
  params?: GetMonthlyExpensesParams
): Promise<MonthlyExpensesResponse> => {
  const response = await apiClient.get<MonthlyExpensesResponse>(
    `/monthly-expenses/${month}/${year}`,
    { params }
  );
  return response.data;
};

/**
 * Get monthly expense instances for current month/year
 */
export const getCurrentMonthlyExpenses = async (
  params?: GetMonthlyExpensesParams
): Promise<MonthlyExpensesResponse> => {
  const response = await apiClient.get<MonthlyExpensesResponse>('/monthly-expenses/current', {
    params,
  });
  return response.data;
};

/**
 * Input for marking monthly expense as paid
 */
export interface PayMonthlyExpenseInput {
  amount: number;
  accountId: string;
  paidDate?: string;
  notes?: string;
}

/**
 * Mark a monthly expense instance as paid
 */
export const payMonthlyExpense = async (
  id: string,
  data: PayMonthlyExpenseInput
): Promise<{
  message: string;
  monthlyExpense: MonthlyExpenseInstance;
  transaction: Record<string, unknown>;
}> => {
  const response = await apiClient.put(`/monthly-expenses/${id}/pay`, data);
  return response.data;
};

/**
 * Undo payment of a monthly expense
 */
export const undoMonthlyExpensePayment = async (
  id: string
): Promise<{
  message: string;
  monthlyExpense: MonthlyExpenseInstance;
}> => {
  const response = await apiClient.put(`/monthly-expenses/${id}/undo`);
  return response.data;
};

/**
 * Input for updating paid monthly expense
 */
export interface UpdateMonthlyExpenseInput {
  amount?: number;
  accountId?: string;
  paidDate?: string;
  notes?: string;
}

/**
 * Update a paid monthly expense instance
 */
export const updateMonthlyExpense = async (
  id: string,
  data: UpdateMonthlyExpenseInput
): Promise<{
  message: string;
  monthlyExpense: MonthlyExpenseInstance;
}> => {
  const response = await apiClient.put(`/monthly-expenses/${id}`, data);
  return response.data;
};
