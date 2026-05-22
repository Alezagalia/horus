/**
 * Timeline Controller
 * F-16 - Arqueología Personal
 * Sprint 16 - US-152
 */

import type { Request, Response } from 'express';
import { timelineQuerySchema } from '@horus/shared';
import * as timelineService from '../services/timeline.service.js';
import { logger } from '../lib/logger.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/timeline?from=&to=&modules=&categories=&limit=&offset=
 * Returns a chronological feed of timeline events (first, completed,
 * anniversary, milestone) across all the user's domains.
 */
export const getTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = timelineQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const response = await timelineService.getTimeline(userId, parsed.data);
    res.status(200).json(response);
  } catch (error: unknown) {
    logger.error('[timeline.getTimeline] failed', error);
    res.status(500).json({ message: msg(error, 'Error al construir el timeline') });
  }
};
