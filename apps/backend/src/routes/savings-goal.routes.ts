/**
 * Savings Goal Routes
 * Metas de Ahorro vinculadas a Cuentas
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as savingsGoalController from '../controllers/savings-goal.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

// GET /api/savings-goals - list all active savings goals
router.get('/', savingsGoalController.list);

// GET /api/savings-goals/:id - get one with progress
router.get('/:id', savingsGoalController.getOne);

// POST /api/savings-goals - create savings goal
router.post('/', savingsGoalController.create);

// PUT /api/savings-goals/:id - update savings goal
router.put('/:id', savingsGoalController.update);

// DELETE /api/savings-goals/:id - soft delete savings goal
router.delete('/:id', savingsGoalController.remove);

export default router;
