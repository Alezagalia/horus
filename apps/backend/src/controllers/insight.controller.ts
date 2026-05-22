/**
 * Insight Controller
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import type { Request, Response } from 'express';
import * as insightService from '../services/insight.service.js';
import { logger } from '../lib/logger.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/insights
 * Runs the detector pipeline lazily and returns the active (non-dismissed) insights.
 */
export const getInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const response = await insightService.getInsights(userId);
    res.status(200).json(response);
  } catch (error: unknown) {
    logger.error('[insight.getInsights] failed', error);
    res.status(500).json({ message: msg(error, 'Error al obtener insights') });
  }
};

/**
 * POST /api/insights/:id/dismiss
 * Marks an insight as dismissed (hidden for 30 days even if the pattern re-emerges).
 */
export const dismissInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await insightService.dismissInsight(userId, id);
    res.status(200).json({ message: 'Insight descartado' });
  } catch (error: unknown) {
    logger.error('[insight.dismissInsight] failed', error);
    const message = msg(error, 'Error al descartar insight');
    if (message === 'Insight no encontrado') {
      res.status(404).json({ message });
      return;
    }
    res.status(500).json({ message });
  }
};

/**
 * POST /api/insights/:id/seen
 * Marks an insight as seen (no longer "new"). Does not dismiss it.
 */
export const markSeenInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await insightService.markSeenInsight(userId, id);
    res.status(200).json({ message: 'Insight marcado como visto' });
  } catch (error: unknown) {
    logger.error('[insight.markSeenInsight] failed', error);
    res.status(500).json({ message: msg(error, 'Error al marcar insight') });
  }
};
