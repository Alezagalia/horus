import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { billingController } from '../controllers/billing.controller.js';

const router: IRouter = Router();

// Webhook is unauthenticated (verified by HMAC signature) and must NOT sit
// behind authMiddleware.
router.post('/webhook', billingController.webhook);

// Google Play RTDN push is unauthenticated (guarded by a shared ?secret=).
router.post('/google/rtdn', billingController.googleRtdn);

// Checkout requires an authenticated, email-verified user.
router.post('/checkout', authMiddleware, billingController.createCheckout);

// Google Play purchase verification (mobile IAP) — authenticated.
router.post('/google/verify', authMiddleware, billingController.verifyGooglePurchase);

export default router;
