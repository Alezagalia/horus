/**
 * Budget Service
 * F-01 - Presupuestos Mensuales por Categoría
 *
 * Business logic for monthly budget templates CRUD and summary calculation.
 */

import { Scope } from '../generated/prisma/client.js';
import { CreateBudgetInput, UpdateBudgetInput } from '../validations/budget.validation.js';
import { prisma } from '../lib/prisma.js';

export interface BudgetSummaryItem {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  spent: number;
  remaining: number;
  percentage: number;
}

/**
 * List all active budgets for a user
 */
export const listBudgets = async (userId: string) => {
  return prisma.budget.findMany({
    where: { userId, isActive: true },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get budget summary for a specific month/year.
 * For each active budget, calculates spent amount from matching transactions.
 */
export const getBudgetsSummary = async (
  userId: string,
  month: number,
  year: number
): Promise<BudgetSummaryItem[]> => {
  const budgets = await prisma.budget.findMany({
    where: { userId, isActive: true },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const summaries = await Promise.all(
    budgets.map(async (budget) => {
      // Sum egreso transactions for this category+currency in the given month/year
      const result = await prisma.$queryRaw<[{ spent: string }]>`
        SELECT COALESCE(SUM(t.amount), 0) AS spent
        FROM transactions t
        JOIN accounts a ON t."accountId" = a.id
        WHERE t."userId" = ${userId}
          AND t."categoryId" = ${budget.categoryId}
          AND t.type = 'egreso'
          AND t."isTransfer" = false
          AND a.currency = ${budget.currency}
          AND EXTRACT(MONTH FROM t.date) = ${month}
          AND EXTRACT(YEAR FROM t.date) = ${year}
      `;

      const spent = parseFloat(result[0]?.spent ?? '0');
      const amount = parseFloat(budget.amount.toString());
      const remaining = amount - spent;
      const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;

      return {
        id: budget.id,
        userId: budget.userId,
        categoryId: budget.categoryId,
        amount,
        currency: budget.currency,
        isActive: budget.isActive,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        category: budget.category,
        spent,
        remaining,
        percentage,
      };
    })
  );

  return summaries;
};

/**
 * Create a new budget. Validates no active duplicate exists for same category+currency.
 */
export const createBudget = async (userId: string, data: CreateBudgetInput) => {
  // Verify category exists, is active, belongs to user, and has scope 'egresos'
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, userId, isActive: true, scope: Scope.egresos },
  });

  if (!category) {
    throw new Error(
      'La categoría no existe, no está activa, no te pertenece, o no es de tipo "egresos"'
    );
  }

  // Check for existing active budget for same category+currency
  const existing = await prisma.budget.findFirst({
    where: { userId, categoryId: data.categoryId, currency: data.currency, isActive: true },
  });

  if (existing) {
    throw new Error('Ya existe un presupuesto activo para esta categoría y moneda');
  }

  return prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency: data.currency,
    },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });
};

/**
 * Update an existing budget (amount and/or currency)
 */
export const updateBudget = async (budgetId: string, userId: string, data: UpdateBudgetInput) => {
  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });

  if (!existing) {
    throw new Error('Presupuesto no encontrado');
  }

  // If currency is changing, check no duplicate will be created
  if (data.currency && data.currency !== existing.currency) {
    const duplicate = await prisma.budget.findFirst({
      where: {
        userId,
        categoryId: existing.categoryId,
        currency: data.currency,
        isActive: true,
        NOT: { id: budgetId },
      },
    });
    if (duplicate) {
      throw new Error('Ya existe un presupuesto activo para esta categoría y moneda');
    }
  }

  return prisma.budget.update({
    where: { id: budgetId },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.currency !== undefined && { currency: data.currency }),
    },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
    },
  });
};

/**
 * Soft delete a budget (isActive = false)
 */
export const deleteBudget = async (budgetId: string, userId: string) => {
  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });

  if (!existing) {
    throw new Error('Presupuesto no encontrado');
  }

  return prisma.budget.update({
    where: { id: budgetId },
    data: { isActive: false },
  });
};
