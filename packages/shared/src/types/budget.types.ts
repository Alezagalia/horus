/**
 * Budget Types
 * F-01 - Presupuestos Mensuales por Categoría
 */

import type { Category } from './category.types.js';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Pick<Category, 'id' | 'name' | 'icon' | 'color'>;
}

export interface BudgetSummary extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface CreateBudgetDTO {
  categoryId: string;
  amount: number;
  currency: string;
}

export interface UpdateBudgetDTO {
  amount?: number;
  currency?: string;
}

export interface BudgetsResponse {
  message: string;
  budgets: Budget[];
  count: number;
}

export interface BudgetsSummaryResponse {
  message: string;
  summary: BudgetSummary[];
  month: number;
  year: number;
}
