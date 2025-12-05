/**
 * Recurring Expense Service
 * Sprint 10 - US-084
 *
 * Business logic for recurring expense templates CRUD
 */

import { Scope } from '../generated/prisma/client.js';
import {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from '../validations/recurringExpense.validation.js';
import { prisma } from '../lib/prisma.js';

/**
 * Create a new recurring expense template
 */
export const createRecurringExpense = async (userId: string, data: CreateRecurringExpenseInput) => {
  // Verify category exists, is active, belongs to user, and has scope 'gastos'
  const category = await prisma.category.findFirst({
    where: {
      id: data.categoryId,
      userId,
      isActive: true,
      scope: Scope.gastos,
    },
  });

  if (!category) {
    throw new Error(
      'La categoría no existe, no está activa, no te pertenece, o no es de tipo "gastos"'
    );
  }

  // Create recurring expense template
  const recurringExpense = await prisma.recurringExpense.create({
    data: {
      userId,
      concept: data.concept,
      categoryId: data.categoryId,
      currency: data.currency,
      dueDay: data.dueDay,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return recurringExpense;
};

/**
 * Get all recurring expense templates for a user
 */
export const getRecurringExpenses = async (userId: string, activeOnly: boolean = false) => {
  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: {
      userId,
      ...(activeOnly && { isActive: true }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      monthlyExpenseInstances: {
        select: {
          id: true,
          month: true,
          year: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return recurringExpenses;
};

/**
 * Get a specific recurring expense template by ID
 */
export const getRecurringExpenseById = async (id: string, userId: string) => {
  const recurringExpense = await prisma.recurringExpense.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      monthlyExpenseInstances: {
        select: {
          id: true,
          month: true,
          year: true,
          amount: true,
          status: true,
          paidDate: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      },
    },
  });

  if (!recurringExpense) {
    throw new Error('Plantilla de gasto recurrente no encontrada');
  }

  return recurringExpense;
};

/**
 * Update a recurring expense template
 */
export const updateRecurringExpense = async (
  id: string,
  userId: string,
  data: UpdateRecurringExpenseInput
) => {
  // Verify template exists and belongs to user
  const existingTemplate = await prisma.recurringExpense.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingTemplate) {
    throw new Error('Plantilla de gasto recurrente no encontrada');
  }

  // If categoryId is being updated, verify it
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
        isActive: true,
        scope: Scope.gastos,
      },
    });

    if (!category) {
      throw new Error(
        'La categoría no existe, no está activa, no te pertenece, o no es de tipo "gastos"'
      );
    }
  }

  // Update template
  const updatedTemplate = await prisma.recurringExpense.update({
    where: {
      id,
    },
    data: {
      ...(data.concept && { concept: data.concept }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.currency && { currency: data.currency }),
      ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return updatedTemplate;
};

/**
 * Soft delete a recurring expense template
 */
export const deleteRecurringExpense = async (id: string, userId: string) => {
  // Verify template exists and belongs to user
  const existingTemplate = await prisma.recurringExpense.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingTemplate) {
    throw new Error('Plantilla de gasto recurrente no encontrada');
  }

  // Soft delete (set isActive = false)
  const deletedTemplate = await prisma.recurringExpense.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return deletedTemplate;
};
