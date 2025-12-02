/**
 * Monthly Expense Controller
 * Sprint 10 - US-085
 *
 * HTTP handlers for monthly expense instance endpoints
 */

import { Request, Response } from 'express';
import {
  monthYearParamsSchema,
  getMonthlyExpensesQuerySchema,
  payMonthlyExpenseSchema,
  updateMonthlyExpenseSchema,
} from '../validations/monthlyExpense.validation.js';
import * as monthlyExpenseService from '../services/monthlyExpense.service.js';

/**
 * GET /api/monthly-expenses/:month/:year
 * Get monthly expense instances for a specific month/year
 */
export const getMonthlyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate path parameters
    const { month, year } = monthYearParamsSchema.parse(req.params);

    // Validate query parameters
    const { status } = getMonthlyExpensesQuerySchema.parse(req.query);

    // Get user ID from auth middleware
    const userId = req.user!.id;

    // Get monthly expenses
    const monthlyExpenses = await monthlyExpenseService.getMonthlyExpenses(
      userId,
      month,
      year,
      status
    );

    res.status(200).json({
      message: 'Gastos mensuales obtenidos exitosamente',
      monthlyExpenses,
      count: monthlyExpenses.length,
      month,
      year,
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
      message: error.message || 'Error al obtener gastos mensuales',
    });
  }
};

/**
 * GET /api/monthly-expenses/current
 * Get monthly expense instances for current month/year
 */
export const getCurrentMonthlyExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query parameters
    const { status } = getMonthlyExpensesQuerySchema.parse(req.query);

    // Get user ID from auth middleware
    const userId = req.user!.id;

    // Get current month/year
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get monthly expenses
    const monthlyExpenses = await monthlyExpenseService.getCurrentMonthlyExpenses(userId, status);

    res.status(200).json({
      message: 'Gastos del mes actual obtenidos exitosamente',
      monthlyExpenses,
      count: monthlyExpenses.length,
      month,
      year,
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
      message: error.message || 'Error al obtener gastos del mes actual',
    });
  }
};

/**
 * PUT /api/monthly-expenses/:id/pay
 * Mark a monthly expense instance as paid
 */
export const payMonthlyExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Validate request body
    const validatedData = payMonthlyExpenseSchema.parse(req.body);

    // Mark expense as paid (atomic transaction)
    const result = await monthlyExpenseService.payMonthlyExpense(id, userId, validatedData);

    res.status(200).json({
      message: 'Gasto mensual marcado como pagado exitosamente',
      monthlyExpense: result.monthlyExpense,
      transaction: result.transaction,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Error de validación',
        errors: error.errors,
      });
      return;
    }

    // Handle specific business logic errors
    if (error.message === 'Gasto mensual no encontrado') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    if (error.message === 'El gasto ya está marcado como pagado') {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    if (error.message === 'Cuenta no encontrada o no está activa') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    if (error.message.startsWith('Saldo insuficiente')) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    // Handle concurrency conflicts (Prisma transaction failures)
    if (error.code === 'P2034') {
      res.status(409).json({
        message: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error al marcar gasto como pagado',
    });
  }
};

/**
 * PUT /api/monthly-expenses/:id
 * Update a paid monthly expense
 */
export const updateMonthlyExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Validate request body
    const validatedData = updateMonthlyExpenseSchema.parse(req.body);

    // Update monthly expense (atomic transaction)
    const updatedExpense = await monthlyExpenseService.updateMonthlyExpense(
      id,
      userId,
      validatedData
    );

    res.status(200).json({
      message: 'Gasto mensual actualizado exitosamente',
      monthlyExpense: updatedExpense,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Error de validación',
        errors: error.errors,
      });
      return;
    }

    if (error.message === 'Gasto mensual no encontrado') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    if (error.message === 'Solo se pueden editar gastos que estén marcados como pagados') {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    if (error.message === 'Cuenta no encontrada o no está activa') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Handle concurrency conflicts
    if (error.code === 'P2034') {
      res.status(409).json({
        message: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error al actualizar gasto mensual',
    });
  }
};

/**
 * PUT /api/monthly-expenses/:id/undo
 * Undo payment of a monthly expense
 */
export const undoMonthlyExpensePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Undo payment (atomic transaction)
    const updatedExpense = await monthlyExpenseService.undoMonthlyExpensePayment(id, userId);

    res.status(200).json({
      message: 'Pago deshecho exitosamente. El gasto vuelve a estar pendiente.',
      monthlyExpense: updatedExpense,
    });
  } catch (error: any) {
    if (error.message === 'Gasto mensual no encontrado') {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    if (error.message === 'Solo se pueden deshacer gastos que estén marcados como pagados') {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    // Handle concurrency conflicts
    if (error.code === 'P2034') {
      res.status(409).json({
        message: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      });
      return;
    }

    res.status(500).json({
      message: error.message || 'Error al deshacer pago de gasto mensual',
    });
  }
};
