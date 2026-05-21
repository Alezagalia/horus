/**
 * Budget Controller
 * F-01 - Presupuestos Mensuales por Categoría
 *
 * HTTP handlers for budget endpoints.
 */

import { Request, Response } from 'express';
import {
  createBudgetSchema,
  updateBudgetSchema,
  getBudgetsSummarySchema,
} from '../validations/budget.validation.js';
import * as budgetService from '../services/budget.service.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/budgets
 * List all active budgets for the authenticated user
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const budgets = await budgetService.listBudgets(userId);
    res
      .status(200)
      .json({ message: 'Presupuestos obtenidos exitosamente', budgets, count: budgets.length });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener presupuestos') });
  }
};

/**
 * GET /api/budgets/summary?month&year
 * Get budget summary (spent, remaining, %) for a given month/year
 */
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = getBudgetsSummarySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }

    const userId = req.user!.id;
    const { month, year } = parsed.data;
    const summary = await budgetService.getBudgetsSummary(userId, month, year);
    res.status(200).json({ message: 'Resumen obtenido exitosamente', summary, month, year });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener resumen de presupuestos') });
  }
};

/**
 * POST /api/budgets
 * Create a new budget template
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }

    const userId = req.user!.id;
    const budget = await budgetService.createBudget(userId, parsed.data);
    res.status(201).json({ message: 'Presupuesto creado exitosamente', budget });
  } catch (error: unknown) {
    res.status(400).json({ message: msg(error, 'Error al crear presupuesto') });
  }
};

/**
 * PUT /api/budgets/:id
 * Update an existing budget
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }

    const userId = req.user!.id;
    const { id } = req.params;
    const budget = await budgetService.updateBudget(id, userId, parsed.data);
    res.status(200).json({ message: 'Presupuesto actualizado exitosamente', budget });
  } catch (error: unknown) {
    const message = msg(error, 'Error al actualizar presupuesto');
    if (message === 'Presupuesto no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

/**
 * DELETE /api/budgets/:id
 * Soft delete a budget
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await budgetService.deleteBudget(id, userId);
    res.status(200).json({ message: 'Presupuesto eliminado exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al eliminar presupuesto');
    if (message === 'Presupuesto no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};
