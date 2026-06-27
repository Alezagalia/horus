/**
 * Food Controller - F-17 Sprint 1
 */

import { Request, Response, NextFunction } from 'express';
import { foodService } from '../services/food.service.js';
import {
  createFoodSchema,
  updateFoodSchema,
  foodFiltersSchema,
} from '../validations/food.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const foodController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const filters = foodFiltersSchema.parse(req.query);
      const foods = await foodService.findAll(user.id, filters);

      res.status(200).json({ foods });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const food = await foodService.findById(req.params.id, user.id);
      res.status(200).json({ food });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = createFoodSchema.parse(req.body);
      const food = await foodService.create(user.id, data);

      res.status(201).json({ message: 'Alimento creado', food });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = updateFoodSchema.parse(req.body);
      const food = await foodService.update(req.params.id, user.id, data);

      res.status(200).json({ message: 'Alimento actualizado', food });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await foodService.delete(req.params.id, user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
