/**
 * Monthly Expense API Service
 * Sprint 13 - US-123
 */

import type {
  MonthlyExpense,
  GetMonthlyExpensesQuery,
  MonthlyExpensesResponse,
  PayMonthlyExpenseDTO,
  UpdateMonthlyExpenseDTO,
} from '@horus/shared';
import { axiosInstance } from '@/lib/axios';

/**
 * Get monthly expenses for specific month/year
 */
export async function getMonthlyExpenses(
  month: number,
  year: number,
  query?: GetMonthlyExpensesQuery
): Promise<MonthlyExpensesResponse> {
  const params = new URLSearchParams();
  if (query?.status) {
    params.append('status', query.status);
  }

  const response = await axiosInstance.get<MonthlyExpensesResponse>(
    `/monthly-expenses/${month}/${year}${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
}

/**
 * Get monthly expenses for current month
 */
export async function getCurrentMonthlyExpenses(
  query?: GetMonthlyExpensesQuery
): Promise<MonthlyExpensesResponse> {
  const params = new URLSearchParams();
  if (query?.status) {
    params.append('status', query.status);
  }

  const response = await axiosInstance.get<MonthlyExpensesResponse>(
    `/monthly-expenses/current${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data;
}

/**
 * Pay monthly expense
 */
export async function payMonthlyExpense(
  id: string,
  data: PayMonthlyExpenseDTO
): Promise<MonthlyExpense> {
  const response = await axiosInstance.put<{
    message: string;
    monthlyExpense: MonthlyExpense;
  }>(`/monthly-expenses/${id}/pay`, data);
  return response.data.monthlyExpense;
}

/**
 * Update paid monthly expense
 */
export async function updateMonthlyExpense(
  id: string,
  data: UpdateMonthlyExpenseDTO
): Promise<MonthlyExpense> {
  const response = await axiosInstance.put<{
    message: string;
    monthlyExpense: MonthlyExpense;
  }>(`/monthly-expenses/${id}`, data);
  return response.data.monthlyExpense;
}

/**
 * Undo monthly expense payment
 */
export async function undoMonthlyExpensePayment(id: string): Promise<MonthlyExpense> {
  const response = await axiosInstance.put<{
    message: string;
    monthlyExpense: MonthlyExpense;
  }>(`/monthly-expenses/${id}/undo`);
  return response.data.monthlyExpense;
}
