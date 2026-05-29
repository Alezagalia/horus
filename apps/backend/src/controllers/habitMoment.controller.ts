import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { habitMomentService } from '../services/habitMoment.service.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

const createSchema = z.object({
  key: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  emoji: z.string().max(10).optional(),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59).optional(),
  endHour: z.number().int().min(0).max(23),
  endMinute: z.number().int().min(0).max(59).optional(),
  sortOrder: z.number().int().optional(),
});

const updateSchema = createSchema
  .omit({ key: true })
  .extend({
    isActive: z.boolean().optional(),
  })
  .partial();

export const habitMomentController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      // Ensure user has default moments (lazy seed for existing users)
      await habitMomentService.ensureDefaults(user.id);
      const moments = await habitMomentService.findAll(user.id);
      res.json({ moments });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const data = createSchema.parse(req.body);
      const moment = await habitMomentService.create(user.id, data);
      res.status(201).json({ moment });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const data = updateSchema.parse(req.body);
      const moment = await habitMomentService.update(req.params.id, user.id, data);
      res.json({ moment });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      await habitMomentService.delete(req.params.id, user.id);
      res.json({ message: 'Moment deleted' });
    } catch (error) {
      next(error);
    }
  },
};
