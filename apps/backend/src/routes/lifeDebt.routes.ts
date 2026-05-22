/**
 * Life Debt Routes
 * F-14 - Deuda de Vida
 * Sprint 17
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as lifeDebtController from '../controllers/lifeDebt.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', lifeDebtController.getLifeDebt);
router.post('/decisions', lifeDebtController.recordDecision);
router.post('/recurring-expenses/:id/review', lifeDebtController.reviewRecurringExpense);

export default router;
