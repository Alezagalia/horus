/**
 * NutritionLog Controller - F-17 Sprint 3
 */

import { Request, Response, NextFunction } from 'express';
import { nutritionLogService } from '../services/nutritionLog.service.js';
import { upsertNutritionLogSchema } from '../validations/nutritionLog.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const nutritionLogController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const { from, to } = req.query;
      const logs = await nutritionLogService.findByDateRange(
        user.id,
        typeof from === 'string' ? from : undefined,
        typeof to === 'string' ? to : undefined
      );

      res.status(200).json({ logs });
    } catch (error) {
      next(error);
    }
  },

  async getByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const log = await nutritionLogService.findByDate(user.id, req.params.date);
      res.status(200).json({ log });
    } catch (error) {
      next(error);
    }
  },

  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = upsertNutritionLogSchema.parse(req.body);
      const log = await nutritionLogService.upsert(user.id, req.params.date, data);

      res.status(200).json({ message: 'Registro actualizado', log });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await nutritionLogService.delete(user.id, req.params.date);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
