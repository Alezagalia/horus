import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { billingController } from '../controllers/billing.controller.js';

const router: IRouter = Router();

// Webhook is unauthenticated (verified by HMAC signature) and must NOT sit
// behind authMiddleware.
router.post('/webhook', billingController.webhook);

// Checkout requires an authenticated, email-verified user.
router.post('/checkout', authMiddleware, billingController.createCheckout);

export default router;
