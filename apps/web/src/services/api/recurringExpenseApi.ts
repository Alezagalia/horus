/**
 * Recurring Expense API Service
 * Sprint 13 - US-122
 */

import type {
  RecurringExpense,
  CreateRecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
  GetRecurringExpensesQuery,
  RecurringExpensesResponse,
} from '@horus/shared';
import { axiosInstance } from '@/lib/axios';

/**
 * Get all recurring expense templates
 */
export async function getRecurringExpenses(
  query?: GetRecurringExpensesQuery
): Promise<RecurringExpensesResponse> {
  const params = new URLSearchParams();
  if (query?.activeOnly !== undefined) {
    params.append('activeOnly', query.activeOnly.toString());
  }

  const response = await axiosInstance.get<RecurringExpensesResponse>(
    `/recurring-expenses${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
}

/**
 * Get recurring expense by ID
 */
export async function getRecurringExpenseById(id: string): Promise<RecurringExpense> {
  const response = await axiosInstance.get<{
    message: string;
    recurringExpense: RecurringExpense;
  }>(`/recurring-expenses/${id}`);
  return response.data.recurringExpense;
}

/**
 * Create a new recurring expense template
 */
export async function createRecurringExpense(
  data: CreateRecurringExpenseDTO
): Promise<RecurringExpense> {
  const response = await axiosInstance.post<{
    message: string;
    recurringExpense: RecurringExpense;
  }>('/recurring-expenses', data);
  return response.data.recurringExpense;
}

/**
 * Update a recurring expense template
 */
export async function updateRecurringExpense(
  id: string,
  data: UpdateRecurringExpenseDTO
): Promise<RecurringExpense> {
  const response = await axiosInstance.put<{
    message: string;
    recurringExpense: RecurringExpense;
  }>(`/recurring-expenses/${id}`, data);
  return response.data.recurringExpense;
}

/**
 * Delete (soft delete) a recurring expense template
 */
export async function deleteRecurringExpense(id: string): Promise<void> {
  await axiosInstance.delete(`/recurring-expenses/${id}`);
}
