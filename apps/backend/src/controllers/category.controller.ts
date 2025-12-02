import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
} from '../validations/category.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const categoryController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const query = getCategoriesQuerySchema.parse(req.query);

      const categories = await categoryService.findAll(user.id, query.scope);

      res.status(200).json({ categories });
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
      const category = await categoryService.findById(id, user.id);

      res.status(200).json({ category });
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

      const validatedData = createCategorySchema.parse(req.body);

      const category = await categoryService.create(user.id, validatedData);

      res.status(201).json({ category });
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
      const validatedData = updateCategorySchema.parse(req.body);

      const category = await categoryService.update(id, user.id, validatedData);

      res.status(200).json({ category });
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
      await categoryService.delete(id, user.id);

      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async setDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const category = await categoryService.setDefault(id, user.id);

      res.status(200).json({ category });
    } catch (error) {
      next(error);
    }
  },
};
