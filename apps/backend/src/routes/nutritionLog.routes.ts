/**
 * NutritionLog Routes - F-17 Sprint 3
 */

import { Router, type IRouter } from 'express';
import { nutritionLogController } from '../controllers/nutritionLog.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', nutritionLogController.getAll);
router.get('/:date', nutritionLogController.getByDate);
router.put('/:date', nutritionLogController.upsert);
router.delete('/:date', nutritionLogController.delete);

export default router;
