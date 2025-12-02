/**
 * Transaction Controller
 * Sprint 9 - US-075
 */

import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  createTransferSchema,
  updateTransferSchema,
} from '../validations/transaction.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const transactionController = {
  /**
   * GET /api/transactions
   * Gets all transactions for authenticated user with filters and pagination
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const filters = getTransactionsQuerySchema.parse(req.query);

      const result = await transactionService.findAll(user.id, filters);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/transactions/:id
   * Gets a specific transaction by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const transaction = await transactionService.findById(id, user.id);

      res.status(200).json({ transaction });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/transactions
   * Creates a new transaction
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const validatedData = createTransactionSchema.parse(req.body);

      const result = await transactionService.create(user.id, validatedData);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/transactions/:id
   * Updates a transaction
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const validatedData = updateTransactionSchema.parse(req.body);

      const result = await transactionService.update(id, user.id, validatedData);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/transactions/:id
   * Deletes a transaction
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;

      await transactionService.delete(id, user.id);

      res.status(200).json({ message: 'Transacción eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/transactions/transfer
   * Creates a transfer between two accounts
   */
  async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const validatedData = createTransferSchema.parse(req.body);

      const result = await transactionService.createTransfer(user.id, validatedData);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/transactions/transfer/:id
   * Updates a transfer (both linked transactions)
   */
  async updateTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const validatedData = updateTransferSchema.parse(req.body);

      const result = await transactionService.updateTransfer(id, user.id, validatedData);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
