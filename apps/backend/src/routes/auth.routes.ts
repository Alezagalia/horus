import { Router, type IRouter } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  authLimiter,
  passwordResetLimiter,
  sensitiveLimiter,
} from '../middlewares/rate-limit.middleware.js';

const router: IRouter = Router();

// Auth endpoints with strict rate limiting to prevent brute force attacks
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/refresh', authLimiter, authController.refresh);
// Email-sending / token-consuming endpoints get the stricter limiter (3/hour)
// to curb abuse (email bombing, token brute force).
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);
router.post('/verify-email', passwordResetLimiter, authController.verifyEmail);
router.post('/resend-verification', passwordResetLimiter, authController.resendVerification);

// Protected routes (no extra rate limiting, already authenticated)
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);

// Account data rights (S-02): export everything, or permanently delete.
router.get('/export', authMiddleware, authController.exportData);
router.delete('/me', authMiddleware, sensitiveLimiter, authController.deleteAccount);

export default router;
