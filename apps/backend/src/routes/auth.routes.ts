import { Router, type IRouter } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rate-limit.middleware.js';

const router: IRouter = Router();

// Auth endpoints with strict rate limiting to prevent brute force attacks
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected routes (no extra rate limiting, already authenticated)
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);

export default router;
