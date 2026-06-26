/**
 * Admin Routes
 * Sprint 10 - US-093 (TECH-001)
 *
 * API routes for admin operations
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminRoleMiddleware } from '../middlewares/adminRole.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router: IRouter = Router();

// All routes require authentication AND the ADMIN role
router.use(authMiddleware);
router.use(adminRoleMiddleware);

/**
 * POST /api/admin/generate-monthly-expenses
 * Manually trigger generation of monthly expense instances
 * Query params:
 *   - month?: number (1-12, defaults to current month)
 *   - year?: number (defaults to current year)
 */
router.post('/generate-monthly-expenses', adminController.generateMonthlyExpensesManual);

export default router;
