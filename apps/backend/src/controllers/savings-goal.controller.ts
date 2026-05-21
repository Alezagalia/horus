/**
 * Savings Goal Controller
 * Metas de Ahorro vinculadas a Cuentas
 *
 * HTTP handlers for savings goal endpoints.
 */

import { Request, Response } from 'express';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
} from '../validations/savings-goal.validation.js';
import * as savingsGoalService from '../services/savings-goal.service.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/savings-goals
 * List all active savings goals for the authenticated user
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const savingsGoals = await savingsGoalService.listSavingsGoals(userId);
    res.status(200).json({
      message: 'Metas de ahorro obtenidas exitosamente',
      savingsGoals,
      count: savingsGoals.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener metas de ahorro') });
  }
};

/**
 * GET /api/savings-goals/:id
 * Get a single savings goal with progress
 */
export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const savingsGoal = await savingsGoalService.getSavingsGoal(id, userId);
    res.status(200).json({ message: 'Meta de ahorro obtenida exitosamente', savingsGoal });
  } catch (error: unknown) {
    const message = msg(error, 'Error al obtener meta de ahorro');
    if (message === 'Meta de ahorro no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};

/**
 * POST /api/savings-goals
 * Create a new savings goal
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createSavingsGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const savingsGoal = await savingsGoalService.createSavingsGoal(userId, parsed.data);
    res.status(201).json({ message: 'Meta de ahorro creada exitosamente', savingsGoal });
  } catch (error: unknown) {
    res.status(400).json({ message: msg(error, 'Error al crear meta de ahorro') });
  }
};

/**
 * PUT /api/savings-goals/:id
 * Update an existing savings goal
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateSavingsGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const { id } = req.params;
    const savingsGoal = await savingsGoalService.updateSavingsGoal(id, userId, parsed.data);
    res.status(200).json({ message: 'Meta de ahorro actualizada exitosamente', savingsGoal });
  } catch (error: unknown) {
    const message = msg(error, 'Error al actualizar meta de ahorro');
    if (message === 'Meta de ahorro no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

/**
 * DELETE /api/savings-goals/:id
 * Soft delete a savings goal
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await savingsGoalService.deleteSavingsGoal(id, userId);
    res.status(200).json({ message: 'Meta de ahorro eliminada exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al eliminar meta de ahorro');
    if (message === 'Meta de ahorro no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};
