/**
 * Stats Routes
 * Sprint 14 - US-131
 */

import { Router } from 'express';
import { workoutStatsController } from '../controllers/workoutStats.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// All stats routes require authentication
router.use(authMiddleware);

/**
 * GET /api/stats/overview
 * Get overview statistics (workouts, volume, exercises, muscle groups, weekly frequency)
 * Query params: days (default: 30)
 */
router.get('/overview', workoutStatsController.getOverviewStats);

export default router;
