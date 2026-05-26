/**
 * ShoppingList Controller - F-17 Sprint 3
 */

import { Request, Response, NextFunction } from 'express';
import { shoppingListService } from '../services/shoppingList.service.js';
import {
  createShoppingListSchema,
  linkTransactionSchema,
  checkItemSchema,
} from '../validations/shoppingList.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const shoppingListController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const shoppingLists = await shoppingListService.findAll(user.id);
      res.status(200).json({ shoppingLists });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const shoppingList = await shoppingListService.findById(req.params.id, user.id);
      res.status(200).json({ shoppingList });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = createShoppingListSchema.parse(req.body);
      const shoppingList = await shoppingListService.create(user.id, data);

      res.status(201).json({ message: 'Lista creada', shoppingList });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const shoppingList = await shoppingListService.update(req.params.id, user.id, req.body);
      res.status(200).json({ message: 'Lista actualizada', shoppingList });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await shoppingListService.delete(req.params.id, user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async checkItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const { checked } = checkItemSchema.parse(req.body);
      const shoppingList = await shoppingListService.checkItem(
        req.params.id,
        req.params.itemId,
        user.id,
        checked
      );

      res.status(200).json({ message: 'Ítem actualizado', shoppingList });
    } catch (error) {
      next(error);
    }
  },

  async generateFromMealPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: 'El nombre es requerido' });
        return;
      }

      const shoppingList = await shoppingListService.generateFromMealPlan(
        req.params.id,
        user.id,
        name
      );

      res.status(201).json({ message: 'Lista generada', shoppingList });
    } catch (error) {
      next(error);
    }
  },

  async linkTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const { transactionId } = linkTransactionSchema.parse(req.body);
      const shoppingList = await shoppingListService.linkTransaction(
        req.params.id,
        user.id,
        transactionId
      );

      res.status(200).json({ message: 'Transacción vinculada', shoppingList });
    } catch (error) {
      next(error);
    }
  },
};
