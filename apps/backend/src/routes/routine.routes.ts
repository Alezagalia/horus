/**
 * Routine Routes
 * Sprint 14 - US-127
 */

import { Router, type IRouter } from 'express';
import { routineController } from '../controllers/routine.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routine routes are protected
router.use(authMiddleware);

router.get('/', routineController.list);
router.get('/:id', routineController.getById);
router.post('/', routineController.create);
router.put('/:id', routineController.update);
router.delete('/:id', routineController.delete);

export default router;
