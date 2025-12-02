/**
 * Recurring Expense Routes
 * Sprint 10 - US-084
 *
 * API routes for recurring expense templates
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as recurringExpenseController from '../controllers/recurringExpense.controller.js';

const router: IRouter = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/recurring-expenses
 * Create a new recurring expense template
 */
router.post('/', recurringExpenseController.createRecurringExpense);

/**
 * GET /api/recurring-expenses
 * Get all recurring expense templates
 * Query params: activeOnly (optional boolean)
 */
router.get('/', recurringExpenseController.getRecurringExpenses);

/**
 * GET /api/recurring-expenses/:id
 * Get a specific recurring expense template
 */
router.get('/:id', recurringExpenseController.getRecurringExpenseById);

/**
 * PUT /api/recurring-expenses/:id
 * Update a recurring expense template
 */
router.put('/:id', recurringExpenseController.updateRecurringExpense);

/**
 * DELETE /api/recurring-expenses/:id
 * Soft delete a recurring expense template
 */
router.delete('/:id', recurringExpenseController.deleteRecurringExpense);

export default router;
