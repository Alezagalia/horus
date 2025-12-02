/**
 * Account Controller
 * Sprint 9 - US-074
 */

import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/account.service.js';
import { createAccountSchema, updateAccountSchema } from '../validations/account.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const accountController = {
  /**
   * GET /api/accounts
   * Gets all active accounts for authenticated user
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const result = await accountService.findAll(user.id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/accounts/:id
   * Gets a specific account by ID with statistics
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const account = await accountService.findById(id, user.id);

      res.status(200).json({ account });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/accounts
   * Creates a new account
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const validatedData = createAccountSchema.parse(req.body);

      const account = await accountService.create(user.id, validatedData);

      res.status(201).json({ account });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/accounts/:id
   * Updates an account
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const validatedData = updateAccountSchema.parse(req.body);

      const account = await accountService.update(id, user.id, validatedData);

      res.status(200).json({ account });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/accounts/:id/deactivate
   * Deactivates an account (soft delete)
   */
  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;

      const account = await accountService.deactivate(id, user.id);

      res.status(200).json({ account });
    } catch (error) {
      next(error);
    }
  },
};
