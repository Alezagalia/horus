/**
 * Recipe Controller - F-17 Sprint 1
 */

import { Request, Response, NextFunction } from 'express';
import { recipeService } from '../services/recipe.service.js';
import {
  createRecipeSchema,
  updateRecipeSchema,
  addIngredientSchema,
} from '../validations/recipe.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const recipeController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const recipes = await recipeService.findAll(user.id);
      res.status(200).json({ recipes });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const recipe = await recipeService.findById(req.params.id, user.id);
      res.status(200).json({ recipe });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = createRecipeSchema.parse(req.body);
      const recipe = await recipeService.create(user.id, data);

      res.status(201).json({ message: 'Receta creada', recipe });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = updateRecipeSchema.parse(req.body);
      const recipe = await recipeService.update(req.params.id, user.id, data);

      res.status(200).json({ message: 'Receta actualizada', recipe });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await recipeService.delete(req.params.id, user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async addIngredient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = addIngredientSchema.parse(req.body);
      const recipe = await recipeService.addIngredient(req.params.id, user.id, data);

      res.status(200).json({ message: 'Ingrediente agregado', recipe });
    } catch (error) {
      next(error);
    }
  },

  async removeIngredient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await recipeService.removeIngredient(req.params.id, req.params.ingredientId, user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
