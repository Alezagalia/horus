/**
 * Recurring Expenses API Service
 * Sprint 10 - US-088
 *
 * API client for recurring expense template endpoints
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

/**
 * Recurring Expense Template
 */
export interface RecurringExpense {
  id: string;
  userId: string;
  concept: string;
  categoryId: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated field
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

/**
 * Query parameters for GET /recurring-expenses
 */
export interface GetRecurringExpensesParams {
  activeOnly?: boolean;
}

/**
 * Response from GET /recurring-expenses
 */
export interface RecurringExpensesResponse {
  message: string;
  recurringExpenses: RecurringExpense[];
  count: number;
}

/**
 * Get all recurring expense templates
 */
export const getRecurringExpenses = async (
  params?: GetRecurringExpensesParams
): Promise<RecurringExpensesResponse> => {
  const response = await apiClient.get<RecurringExpensesResponse>('/recurring-expenses', {
    params,
  });
  return response.data;
};

/**
 * Get recurring expense template by ID
 */
export const getRecurringExpenseById = async (id: string): Promise<RecurringExpense> => {
  const response = await apiClient.get<{
    message: string;
    recurringExpense: RecurringExpense;
  }>(`/recurring-expenses/${id}`);
  return response.data.recurringExpense;
};

/**
 * Input for creating a recurring expense
 */
export interface CreateRecurringExpenseInput {
  concept: string;
  categoryId: string;
  currency: string;
}

/**
 * Create a new recurring expense template
 */
export const createRecurringExpense = async (
  data: CreateRecurringExpenseInput
): Promise<RecurringExpense> => {
  const response = await apiClient.post<{
    message: string;
    recurringExpense: RecurringExpense;
  }>('/recurring-expenses', data);
  return response.data.recurringExpense;
};

/**
 * Input for updating a recurring expense
 */
export interface UpdateRecurringExpenseInput {
  concept?: string;
  categoryId?: string;
  currency?: string;
  isActive?: boolean;
}

/**
 * Update a recurring expense template
 */
export const updateRecurringExpense = async (
  id: string,
  data: UpdateRecurringExpenseInput
): Promise<RecurringExpense> => {
  const response = await apiClient.put<{
    message: string;
    recurringExpense: RecurringExpense;
  }>(`/recurring-expenses/${id}`, data);
  return response.data.recurringExpense;
};

/**
 * Delete (soft delete) a recurring expense template
 */
export const deleteRecurringExpense = async (id: string): Promise<void> => {
  await apiClient.delete(`/recurring-expenses/${id}`);
};
