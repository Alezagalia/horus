/**
 * Admin Routes
 * Sprint 10 - US-093 (TECH-001)
 *
 * API routes for admin operations
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router: IRouter = Router();

// All routes require authentication
router.use(authMiddleware);

// TODO: Add admin role check middleware when roles are implemented
// router.use(adminRoleMiddleware);

/**
 * POST /api/admin/generate-monthly-expenses
 * Manually trigger generation of monthly expense instances
 * Query params:
 *   - month?: number (1-12, defaults to current month)
 *   - year?: number (defaults to current year)
 *
 * IMPORTANT: This endpoint should be protected with admin role in production
 * For now, it's protected only with authentication
 */
router.post('/generate-monthly-expenses', adminController.generateMonthlyExpensesManual);

export default router;
