import { Router, type IRouter } from 'express';
import { habitMomentController } from '../controllers/habitMoment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', habitMomentController.getAll);
router.post('/', habitMomentController.create);
router.put('/:id', habitMomentController.update);
router.delete('/:id', habitMomentController.delete);

export default router;
