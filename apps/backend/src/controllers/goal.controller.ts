/**
 * Goal Controller
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { Request, Response } from 'express';
import {
  createGoalSchema,
  updateGoalSchema,
  createKeyResultSchema,
  updateKeyResultSchema,
} from '../validations/goal.validation.js';
import * as goalService from '../services/goal.service.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const status = req.query.status as string | undefined;
    const goals = await goalService.listGoals(userId, status);
    res.status(200).json({ message: 'Metas obtenidas exitosamente', goals, count: goals.length });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener metas') });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const goal = await goalService.getGoalById(id, userId);
    res.status(200).json({ message: 'Meta obtenida exitosamente', goal });
  } catch (error: unknown) {
    const message = msg(error, 'Error al obtener meta');
    if (message === 'Meta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const goal = await goalService.createGoal(userId, parsed.data);
    res.status(201).json({ message: 'Meta creada exitosamente', goal });
  } catch (error: unknown) {
    res.status(400).json({ message: msg(error, 'Error al crear meta') });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const { id } = req.params;
    const goal = await goalService.updateGoal(id, userId, parsed.data);
    res.status(200).json({ message: 'Meta actualizada exitosamente', goal });
  } catch (error: unknown) {
    const message = msg(error, 'Error al actualizar meta');
    if (message === 'Meta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await goalService.deleteGoal(id, userId);
    res.status(200).json({ message: 'Meta eliminada exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al eliminar meta');
    if (message === 'Meta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};

// ─── Key Results ──────────────────────────────────────────────────────────────

export const createKR = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createKeyResultSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const { id } = req.params;
    const keyResult = await goalService.createKeyResult(id, userId, parsed.data);
    res.status(201).json({ message: 'Key Result creado exitosamente', keyResult });
  } catch (error: unknown) {
    const message = msg(error, 'Error al crear Key Result');
    if (message === 'Meta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const updateKR = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateKeyResultSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const { id, krId } = req.params;
    const keyResult = await goalService.updateKeyResult(krId, id, userId, parsed.data);
    res.status(200).json({ message: 'Key Result actualizado exitosamente', keyResult });
  } catch (error: unknown) {
    const message = msg(error, 'Error al actualizar Key Result');
    if (message === 'Meta no encontrada' || message === 'Key Result no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const removeKR = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id, krId } = req.params;
    await goalService.deleteKeyResult(krId, id, userId);
    res.status(200).json({ message: 'Key Result eliminado exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al eliminar Key Result');
    if (message === 'Meta no encontrada' || message === 'Key Result no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};

// ─── Link / Unlink ────────────────────────────────────────────────────────────

export const linkHabit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id, habitId } = req.params;
    await goalService.linkHabit(id, userId, habitId);
    res.status(200).json({ message: 'Hábito vinculado exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al vincular hábito');
    if (message === 'Meta no encontrada' || message === 'Hábito no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const unlinkHabit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id, habitId } = req.params;
    await goalService.unlinkHabit(id, userId, habitId);
    res.status(200).json({ message: 'Hábito desvinculado exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al desvincular hábito');
    if (message === 'Meta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const linkTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id, taskId } = req.params;
    await goalService.linkTask(id, userId, taskId);
    res.status(200).json({ message: 'Tarea vinculada exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al vincular tarea');
    if (message === 'Meta no encontrada' || message === 'Tarea no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const unlinkTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id, taskId } = req.params;
    await goalService.unlinkTask(id, userId, taskId);
    res.status(200).json({ message: 'Tarea desvinculada exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al desvincular tarea');
    if (message === 'Meta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};
