/**
 * Sync Routes
 * Sprint 8 - US-067
 *
 * OAuth2 and synchronization endpoints for Google Calendar
 */

import { Router, type IRouter } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// Google Calendar OAuth2 endpoints
router.post('/google-calendar/connect', authMiddleware, syncController.connectGoogleCalendar);
router.get('/google-calendar/callback', syncController.handleGoogleCallback); // No auth - receives callback from Google
router.post('/google-calendar/disconnect', authMiddleware, syncController.disconnectGoogleCalendar);
router.get('/google-calendar/status', authMiddleware, syncController.getGoogleCalendarStatus);

// Google Calendar sync endpoints
router.post('/google-calendar/sync', authMiddleware, syncController.syncFromGoogle);

// Temporary endpoint to reset sync (for testing/debugging)
router.post('/google-calendar/reset-sync', authMiddleware, syncController.resetSync);

export default router;
