/**
 * MealPlan Controller - F-17 Sprint 2
 */

import { Request, Response, NextFunction } from 'express';
import { mealPlanService } from '../services/mealPlan.service.js';
import { createMealPlanSchema, addMealEntrySchema } from '../validations/mealPlan.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const mealPlanController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const mealPlans = await mealPlanService.findAll(user.id);
      res.status(200).json({ mealPlans });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const mealPlan = await mealPlanService.findById(req.params.id, user.id);
      res.status(200).json({ mealPlan });
    } catch (error) {
      next(error);
    }
  },

  async getByWeek(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const { weekStart } = req.query;
      if (!weekStart || typeof weekStart !== 'string') {
        res.status(400).json({ message: 'weekStart requerido' });
        return;
      }

      const mealPlan = await mealPlanService.findByWeek(user.id, weekStart);
      res.status(200).json({ mealPlan });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = createMealPlanSchema.parse(req.body);
      const mealPlan = await mealPlanService.create(user.id, data);

      res.status(201).json({ message: 'Plan creado', mealPlan });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await mealPlanService.delete(req.params.id, user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async addEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = addMealEntrySchema.parse(req.body);
      const mealPlan = await mealPlanService.addEntry(req.params.id, user.id, data);

      res.status(201).json({ message: 'Entrada agregada', mealPlan });
    } catch (error) {
      next(error);
    }
  },

  async deleteEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await mealPlanService.deleteEntry(req.params.id, req.params.entryId, user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getMacros(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const dayMacros = await mealPlanService.getDayMacros(req.params.id, user.id);
      res.status(200).json({ dayMacros });
    } catch (error) {
      next(error);
    }
  },
};
