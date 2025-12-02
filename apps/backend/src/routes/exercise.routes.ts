/**
 * Exercise Routes
 * Sprint 14 - US-126, US-131
 */

import { Router, type IRouter } from 'express';
import { exerciseController } from '../controllers/exercise.controller.js';
import { workoutStatsController } from '../controllers/workoutStats.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All exercise routes are protected
router.use(authMiddleware);

router.get('/', exerciseController.getAll);
router.get('/:id', exerciseController.getById);
router.get('/:id/stats', workoutStatsController.getExerciseStats);
router.post('/', exerciseController.create);
router.put('/:id', exerciseController.update);
router.delete('/:id', exerciseController.delete);

export default router;
