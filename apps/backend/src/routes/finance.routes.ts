/**
 * Finance Statistics Routes
 * Sprint 9 - US-077
 */

import { Router, type IRouter } from 'express';
import { financeStatsController } from '../controllers/financeStats.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routes protected with authMiddleware
router.use(authMiddleware);

// Finance statistics routes
router.get('/stats', financeStatsController.getStats);

export default router;
