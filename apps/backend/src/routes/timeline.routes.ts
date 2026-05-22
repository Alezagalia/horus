/**
 * Timeline Routes
 * F-16 - Arqueología Personal
 * Sprint 16 - US-152
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as timelineController from '../controllers/timeline.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

// GET /api/timeline
router.get('/', timelineController.getTimeline);

export default router;
