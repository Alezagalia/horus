/**
 * Routine Controller
 * Sprint 14 - US-127
 */

import { Request, Response, NextFunction } from 'express';
import { routineService } from '../services/routine.service.js';
import { createRoutineSchema, updateRoutineSchema } from '../validations/routine.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const routineController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const routines = await routineService.findAll(user.id);

      res.status(200).json({ routines });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const routine = await routineService.findById(id, user.id);

      res.status(200).json({ routine });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const data = createRoutineSchema.parse(req.body);
      const routine = await routineService.create(user.id, data);

      res.status(201).json({ message: 'Routine created successfully', routine });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const data = updateRoutineSchema.parse(req.body);
      const routine = await routineService.update(id, user.id, data);

      res.status(200).json({ message: 'Routine updated successfully', routine });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      await routineService.delete(id, user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
