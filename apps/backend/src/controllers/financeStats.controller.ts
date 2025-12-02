/**
 * Finance Statistics Controller
 * Sprint 9 - US-077
 */

import { Request, Response, NextFunction } from 'express';
import { financeStatsService } from '../services/financeStats.service.js';
import { UnauthorizedError, BadRequestError } from '../middlewares/error.middleware.js';

export const financeStatsController = {
  /**
   * GET /api/finance/stats
   * Gets financial statistics for authenticated user
   * Query params: month (1-12), year (YYYY)
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Parse query params
      const monthParam = req.query.month as string | undefined;
      const yearParam = req.query.year as string | undefined;

      let month: number | undefined;
      let year: number | undefined;

      if (monthParam) {
        month = parseInt(monthParam, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          throw new BadRequestError('Month must be between 1 and 12');
        }
      }

      if (yearParam) {
        year = parseInt(yearParam, 10);
        if (isNaN(year) || year < 2000 || year > 2100) {
          throw new BadRequestError('Year must be between 2000 and 2100');
        }
      }

      const stats = await financeStatsService.getStats(user.id, month, year);

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },
};
