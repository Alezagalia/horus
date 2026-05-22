/**
 * Analytics Controller
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-142
 */

import type { Request, Response } from 'express';
import {
  analyticsRangeQuerySchema,
  compareQuerySchema,
  financeTrendsQuerySchema,
  heatmapQuerySchema,
  productivityQuerySchema,
} from '@horus/shared';
import { parseISODateToNoonUTC } from '../utils/date.utils.js';
import * as analyticsService from '../services/analytics.service.js';
import { logger } from '../lib/logger.js';

function msg(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * GET /api/analytics/overview?from=&to=
 * Returns an aggregated snapshot of habits, tasks, finance, workouts and goals.
 */
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = analyticsRangeQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const { from, to } = analyticsService.resolveOverviewRange(parsed.data.from, parsed.data.to);
    const overview = await analyticsService.getOverview(userId, from, to);
    res.status(200).json(overview);
  } catch (error: unknown) {
    logger.error('[analytics.getOverview] failed', error);
    res.status(500).json({ message: msg(error, 'Error al calcular overview de analytics') });
  }
};

/**
 * GET /api/analytics/habits/heatmap?year=YYYY
 * Returns a year-long heatmap of habit completions (GitHub-style contributions).
 */
export const getHabitsHeatmap = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = heatmapQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const year = parsed.data.year ?? new Date().getUTCFullYear();
    const heatmap = await analyticsService.getHabitHeatmap(userId, year);
    res.status(200).json(heatmap);
  } catch (error: unknown) {
    logger.error('[analytics.getHabitsHeatmap] failed', error);
    res.status(500).json({ message: msg(error, 'Error al calcular heatmap de hábitos') });
  }
};

/**
 * GET /api/analytics/finance/trends?months=N
 * Returns monthly spend per category plus a linear projection for the current month.
 */
export const getFinanceTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = financeTrendsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const trends = await analyticsService.getFinanceTrends(userId, parsed.data.months);
    res.status(200).json(trends);
  } catch (error: unknown) {
    logger.error('[analytics.getFinanceTrends] failed', error);
    res.status(500).json({ message: msg(error, 'Error al calcular tendencias financieras') });
  }
};

/**
 * GET /api/analytics/productivity?from=&to=
 * Returns task-completion patterns by day-of-week and hour-of-day.
 */
export const getProductivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = productivityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const { from, to } = analyticsService.resolveProductivityRange(
      parsed.data.from,
      parsed.data.to
    );
    const productivity = await analyticsService.getProductivity(userId, from, to);
    res.status(200).json(productivity);
  } catch (error: unknown) {
    logger.error('[analytics.getProductivity] failed', error);
    res.status(500).json({ message: msg(error, 'Error al calcular productividad') });
  }
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const inclusiveDays = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;

/**
 * GET /api/analytics/compare
 * Compares two date ranges across selected dimensions.
 */
export const compare = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = compareQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ message: 'Error de validación', errors: parsed.error.issues });
      return;
    }

    const userId = req.user!.id;
    const { currentFrom, currentTo, previousFrom, previousTo, dimensions } = parsed.data;

    const current = {
      from: parseISODateToNoonUTC(currentFrom),
      to: parseISODateToNoonUTC(currentTo),
    };
    const previous = {
      from: parseISODateToNoonUTC(previousFrom),
      to: parseISODateToNoonUTC(previousTo),
    };

    // Warn (header only) when range lengths differ by more than 1 day.
    const currentDays = inclusiveDays(current.from, current.to);
    const previousDays = inclusiveDays(previous.from, previous.to);
    if (Math.abs(currentDays - previousDays) > 1) {
      res.setHeader('X-Analytics-Warning', 'period-length-mismatch');
    }

    const comparison = await analyticsService.comparePeriods(userId, current, previous, dimensions);
    res.status(200).json(comparison);
  } catch (error: unknown) {
    logger.error('[analytics.compare] failed', error);
    res.status(500).json({ message: msg(error, 'Error al comparar períodos') });
  }
};
