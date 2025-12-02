/**
 * Recurring Expense Controller
 * Sprint 10 - US-084
 *
 * HTTP handlers for recurring expense templates endpoints
 */

import { Request, Response } from 'express';
import {
  createRecurringExpenseSchema,
  updateRecurringExpenseSchema,
  getRecurringExpensesQuerySchema,
} from '../validations/recurringExpense.validation.js';
import * as recurringExpenseService from '../services/recurringExpense.service.js';

/**
 * POST /api/recurring-expenses
 * Create a new recurring expense template
 */
export const createRecurringExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createRecurringExpenseSchema.parse(req.body);

    // Get user ID from auth middleware
    const userId = req.user!.id;

    // Create recurring expense
    const recurringExpense = await recurringExpenseService.createRecurringExpense(
      userId,
      validatedData
    );

    res.status(201).json({
      message: 'Plantilla de gasto recurrente creada exitosamente',
      recurringExpense,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Error de validación',
        errors: error.errors,
      });
      return;
    }

    res.status(400).json({
      message: error.message || 'Error al crear plantilla de gasto recurrente',
    });
  }
};

/**
 * GET /api/recurring-expenses
 * Get all recurring expense templates for authenticated user
 */
export const getRecurringExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const { activeOnly } = getRecurringExpensesQuerySchema.parse(req.query);

    // Get user ID from auth middleware
    const userId = req.user!.id;

    // Get recurring expenses
    const recurringExpenses = await recurringExpenseService.getRecurringExpenses(
      userId,
      activeOnly
    );

    res.status(200).json({
      message: 'Plantillas obtenidas exitosamente',
      recurringExpenses,
      count: recurringExpenses.length,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Error de validación',
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error al obtener plantillas de gastos recurrentes',
    });
  }
};

/**
 * GET /api/recurring-expenses/:id
 * Get a specific recurring expense template by ID
 */
export const getRecurringExpenseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const recurringExpense = await recurringExpenseService.getRecurringExpenseById(id, userId);

    res.status(200).json({
      message: 'Plantilla obtenida exitosamente',
      recurringExpense,
    });
  } catch (error: any) {
    if (error.message === 'Plantilla de gasto recurrente no encontrada') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error al obtener plantilla de gasto recurrente',
    });
  }
};

/**
 * PUT /api/recurring-expenses/:id
 * Update a recurring expense template
 */
export const updateRecurringExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Validate request body
    const validatedData = updateRecurringExpenseSchema.parse(req.body);

    // Update recurring expense
    const updatedTemplate = await recurringExpenseService.updateRecurringExpense(
      id,
      userId,
      validatedData
    );

    res.status(200).json({
      message: 'Plantilla de gasto recurrente actualizada exitosamente',
      recurringExpense: updatedTemplate,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Error de validación',
        errors: error.errors,
      });
      return;
    }

    if (error.message === 'Plantilla de gasto recurrente no encontrada') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    res.status(400).json({
      message: error.message || 'Error al actualizar plantilla de gasto recurrente',
    });
  }
};

/**
 * DELETE /api/recurring-expenses/:id
 * Soft delete a recurring expense template
 */
export const deleteRecurringExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await recurringExpenseService.deleteRecurringExpense(id, userId);

    res.status(200).json({
      message: 'Plantilla de gasto recurrente eliminada exitosamente',
    });
  } catch (error: any) {
    if (error.message === 'Plantilla de gasto recurrente no encontrada') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error al eliminar plantilla de gasto recurrente',
    });
  }
};
