/**
 * Workout Stats Controller
 * Sprint 14 - US-131
 */

import { Request, Response, NextFunction } from 'express';
import { workoutStatsService } from '../services/workoutStats.service.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const workoutStatsController = {
  async getExerciseStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: exerciseId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 90;

      const stats = await workoutStatsService.getExerciseStats(user.id, exerciseId, days);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  async getOverviewStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const days = req.query.days ? parseInt(req.query.days as string) : 30;

      const stats = await workoutStatsService.getOverviewStats(user.id, days);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },
};
