/**
 * Life Debt Controller
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import type { Request, Response } from 'express';
import { lifeDebtDecisionRequestSchema } from '@horus/shared';
import * as lifeDebtService from '../services/lifeDebt.service.js';
import { logger } from '../lib/logger.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/life-debt
 * Returns the list of items detected as "debt" plus per-type totals.
 */
export const getLifeDebt = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const response = await lifeDebtService.getLifeDebt(userId);
    res.status(200).json(response);
  } catch (error: unknown) {
    logger.error('[lifeDebt.getLifeDebt] failed', error);
    res.status(500).json({ message: msg(error, 'Error al obtener la deuda de vida') });
  }
};

/**
 * POST /api/life-debt/decisions
 * Records a decision (commit/delegate/delete) for a task or habit.
 */
export const recordDecision = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = lifeDebtDecisionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const decision = await lifeDebtService.recordDecision(userId, parsed.data);
    res.status(201).json(decision);
  } catch (error: unknown) {
    logger.error('[lifeDebt.recordDecision] failed', error);
    const message = msg(error, 'Error al registrar decisión');
    if (message === 'Tarea no encontrada' || message === 'Hábito no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};

/**
 * POST /api/life-debt/recurring-expenses/:id/review
 * Marks a recurring expense as recently reviewed (resets the 6-month timer).
 */
export const reviewRecurringExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await lifeDebtService.reviewRecurringExpense(userId, id);
    res.status(200).json(result);
  } catch (error: unknown) {
    logger.error('[lifeDebt.reviewRecurringExpense] failed', error);
    const message = msg(error, 'Error al marcar como revisado');
    if (message === 'Gasto recurrente no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};
