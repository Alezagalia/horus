/**
 * Weekly Review Controller (F-03)
 * Revisión Semanal / Check-in
 */

import { Request, Response } from 'express';
import {
  createReviewSchema,
  updateReviewSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from '../validations/weeklyReview.validation.js';
import * as reviewService from '../services/weeklyReview.service.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const weekStart = req.query.weekStart as string;
    if (!weekStart) {
      res.status(400).json({ message: 'weekStart es requerido' });
      return;
    }
    const stats = await reviewService.getWeekStats(userId, weekStart);
    res.status(200).json({ message: 'Stats obtenidos exitosamente', stats });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener stats') });
  }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const getCurrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const weekStart = req.query.weekStart as string;
    if (!weekStart) {
      res.status(400).json({ message: 'weekStart es requerido' });
      return;
    }
    const review = await reviewService.getOrCreateReview(userId, weekStart);
    res.status(200).json({ message: 'Revisión obtenida exitosamente', review });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener revisión') });
  }
};

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const reviews = await reviewService.listReviews(userId, limit);
    res
      .status(200)
      .json({ message: 'Revisiones obtenidas exitosamente', reviews, count: reviews.length });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener revisiones') });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const review = await reviewService.createReview(userId, parsed.data);
    res.status(201).json({ message: 'Revisión creada exitosamente', review });
  } catch (error: unknown) {
    res.status(400).json({ message: msg(error, 'Error al crear revisión') });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const { id } = req.params;
    const review = await reviewService.updateReview(id, userId, parsed.data);
    res.status(200).json({ message: 'Revisión actualizada exitosamente', review });
  } catch (error: unknown) {
    const message = msg(error, 'Error al actualizar revisión');
    if (message === 'Revisión no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

// ─── Questions ────────────────────────────────────────────────────────────────

export const listQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const questions = await reviewService.listQuestions(userId);
    res
      .status(200)
      .json({ message: 'Preguntas obtenidas exitosamente', questions, count: questions.length });
  } catch (error: unknown) {
    res.status(500).json({ message: msg(error, 'Error al obtener preguntas') });
  }
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const question = await reviewService.createQuestion(userId, parsed.data);
    res.status(201).json({ message: 'Pregunta creada exitosamente', question });
  } catch (error: unknown) {
    res.status(400).json({ message: msg(error, 'Error al crear pregunta') });
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.errors });
      return;
    }
    const userId = req.user!.id;
    const { id } = req.params;
    const question = await reviewService.updateQuestion(id, userId, parsed.data);
    res.status(200).json({ message: 'Pregunta actualizada exitosamente', question });
  } catch (error: unknown) {
    const message = msg(error, 'Error al actualizar pregunta');
    if (message === 'Pregunta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
};

export const removeQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await reviewService.deleteQuestion(id, userId);
    res.status(200).json({ message: 'Pregunta eliminada exitosamente' });
  } catch (error: unknown) {
    const message = msg(error, 'Error al eliminar pregunta');
    if (message === 'Pregunta no encontrada') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};
