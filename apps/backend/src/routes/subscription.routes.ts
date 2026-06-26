import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { subscriptionController } from '../controllers/subscription.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', subscriptionController.getMine);

export default router;
