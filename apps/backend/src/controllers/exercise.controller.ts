/**
 * Exercise Controller
 * Sprint 14 - US-126
 */

import { Request, Response, NextFunction } from 'express';
import { exerciseService } from '../services/exercise.service.js';
import {
  createExerciseSchema,
  updateExerciseSchema,
  exerciseFiltersSchema,
} from '../validations/exercise.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const exerciseController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const filters = exerciseFiltersSchema.parse(req.query);
      const exercises = await exerciseService.findAll(user.id, filters);

      res.status(200).json({ exercises });
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
      const exercise = await exerciseService.findById(id, user.id);

      res.status(200).json({ exercise });
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

      const data = createExerciseSchema.parse(req.body);
      const exercise = await exerciseService.create(user.id, data);

      res.status(201).json({ message: 'Exercise created successfully', exercise });
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
      const data = updateExerciseSchema.parse(req.body);
      const exercise = await exerciseService.update(id, user.id, data);

      res.status(200).json({ message: 'Exercise updated successfully', exercise });
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
      await exerciseService.delete(id, user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
