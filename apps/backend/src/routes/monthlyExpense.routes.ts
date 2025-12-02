/**
 * Monthly Expense Routes
 * Sprint 10 - US-085
 *
 * API routes for monthly expense instances
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as monthlyExpenseController from '../controllers/monthlyExpense.controller.js';

const router: IRouter = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/monthly-expenses/current
 * Get monthly expense instances for current month
 * Query params: status (optional: pendiente|pagado)
 *
 * IMPORTANT: This route must come BEFORE /:month/:year
 * to avoid "current" being interpreted as a month parameter
 */
router.get('/current', monthlyExpenseController.getCurrentMonthlyExpenses);

/**
 * GET /api/monthly-expenses/:month/:year
 * Get monthly expense instances for specific month/year
 * Query params: status (optional: pendiente|pagado)
 */
router.get('/:month/:year', monthlyExpenseController.getMonthlyExpenses);

/**
 * PUT /api/monthly-expenses/:id/pay
 * Mark a monthly expense instance as paid
 * Body: { amount, accountId, paidDate?, notes? }
 */
router.put('/:id/pay', monthlyExpenseController.payMonthlyExpense);

/**
 * PUT /api/monthly-expenses/:id/undo
 * Undo payment of a monthly expense instance
 * Changes status back to 'pendiente' and reverts account balance
 */
router.put('/:id/undo', monthlyExpenseController.undoMonthlyExpensePayment);

/**
 * PUT /api/monthly-expenses/:id
 * Update a paid monthly expense instance
 * Body: { amount?, accountId?, paidDate?, notes? }
 */
router.put('/:id', monthlyExpenseController.updateMonthlyExpense);

export default router;
