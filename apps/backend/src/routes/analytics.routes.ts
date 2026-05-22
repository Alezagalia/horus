/**
 * Analytics Routes
 * F-07 - Reportes y Tendencias
 * Sprint 15 - US-142
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

// GET /api/analytics/overview?from=&to=
router.get('/overview', analyticsController.getOverview);

// GET /api/analytics/habits/heatmap?year=YYYY
router.get('/habits/heatmap', analyticsController.getHabitsHeatmap);

// GET /api/analytics/finance/trends?months=N
router.get('/finance/trends', analyticsController.getFinanceTrends);

// GET /api/analytics/productivity?from=&to=
router.get('/productivity', analyticsController.getProductivity);

// GET /api/analytics/compare?currentFrom=&currentTo=&previousFrom=&previousTo=&dimensions=
router.get('/compare', analyticsController.compare);

export default router;
