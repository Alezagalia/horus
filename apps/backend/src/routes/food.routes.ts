/**
 * Food Routes - F-17 Sprint 1
 */

import { Router, type IRouter } from 'express';
import { foodController } from '../controllers/food.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', foodController.getAll);
router.get('/:id', foodController.getById);
router.post('/', foodController.create);
router.put('/:id', foodController.update);
router.delete('/:id', foodController.delete);

export default router;
