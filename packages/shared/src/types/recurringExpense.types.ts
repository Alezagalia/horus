/**
 * Recurring Expense Types
 * Sprint 10/13 - Shared types for recurring expense templates
 */

import type { Category } from './category.types';

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
  // Populated relations
  category?: Category;
}

/**
 * DTO for creating recurring expense
 */
export interface CreateRecurringExpenseDTO {
  concept: string;
  categoryId: string;
  currency: string;
}

/**
 * DTO for updating recurring expense
 */
export interface UpdateRecurringExpenseDTO {
  concept?: string;
  categoryId?: string;
  currency?: string;
  isActive?: boolean;
}

/**
 * Query parameters for GET /recurring-expenses
 */
export interface GetRecurringExpensesQuery {
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
