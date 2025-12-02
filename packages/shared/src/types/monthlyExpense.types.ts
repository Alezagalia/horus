/**
 * Monthly Expense Types
 * Sprint 10/13 - Shared types for monthly expense instances
 */

import type { Category } from './category.types';
import type { Account } from './account.types';
import type { RecurringExpense } from './recurringExpense.types';

export type ExpenseStatus = 'pendiente' | 'pagado';

/**
 * Monthly Expense Instance
 */
export interface MonthlyExpense {
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
  // Populated relations
  recurringExpense?: RecurringExpense;
  category?: Category;
  account?: Account;
}

/**
 * Query parameters for GET /monthly-expenses
 */
export interface GetMonthlyExpensesQuery {
  status?: ExpenseStatus;
}

/**
 * Response from GET /monthly-expenses
 */
export interface MonthlyExpensesResponse {
  message: string;
  monthlyExpenses: MonthlyExpense[];
  count: number;
  month: number;
  year: number;
}

/**
 * DTO for paying monthly expense
 */
export interface PayMonthlyExpenseDTO {
  amount: number;
  accountId: string;
  paidDate?: string;
  notes?: string;
}

/**
 * DTO for updating paid monthly expense
 */
export interface UpdateMonthlyExpenseDTO {
  amount?: number;
  accountId?: string;
  paidDate?: string;
  notes?: string;
}
