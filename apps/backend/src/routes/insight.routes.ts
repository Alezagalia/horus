/**
 * Insight Routes
 * F-12 - Motor de Correlaciones Personales
 * Sprint 18
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as insightController from '../controllers/insight.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', insightController.getInsights);
router.post('/:id/dismiss', insightController.dismissInsight);
router.post('/:id/seen', insightController.markSeenInsight);

export default router;
