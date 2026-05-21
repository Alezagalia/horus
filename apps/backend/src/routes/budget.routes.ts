/**
 * Budget Routes
 * F-01 - Presupuestos Mensuales por Categoría
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as budgetController from '../controllers/budget.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

// GET /api/budgets - list all active budgets
router.get('/', budgetController.list);

// GET /api/budgets/summary?month&year - budget summary with spent amounts
// Must be before /:id route to avoid conflict
router.get('/summary', budgetController.getSummary);

// POST /api/budgets - create budget
router.post('/', budgetController.create);

// PUT /api/budgets/:id - update budget
router.put('/:id', budgetController.update);

// DELETE /api/budgets/:id - soft delete budget
router.delete('/:id', budgetController.remove);

export default router;
