/**
 * Sync Routes
 * Sprint 8 - US-067
 *
 * OAuth2 and synchronization endpoints for Google Calendar
 */

import { Router, type IRouter } from 'express';
import { syncController } from '../controllers/sync.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireFeature } from '../middlewares/entitlements.middleware.js';

const router: IRouter = Router();

const proCalendar = requireFeature('calendarSync');

// Google Calendar OAuth2 endpoints (connecting/syncing is a Pro feature)
router.post(
  '/google-calendar/connect',
  authMiddleware,
  proCalendar,
  syncController.connectGoogleCalendar
);
router.get('/google-calendar/callback', syncController.handleGoogleCallback); // No auth - receives callback from Google
// Disconnect & status stay open so a downgraded user can still manage/clear it.
router.post('/google-calendar/disconnect', authMiddleware, syncController.disconnectGoogleCalendar);
router.get('/google-calendar/status', authMiddleware, syncController.getGoogleCalendarStatus);

// Google Calendar sync endpoints
router.post('/google-calendar/sync', authMiddleware, proCalendar, syncController.syncFromGoogle);
router.post('/google-calendar/resync', authMiddleware, proCalendar, syncController.forceResync);

// Temporary endpoint to reset sync (for testing/debugging)
router.post('/google-calendar/reset-sync', authMiddleware, syncController.resetSync);

export default router;
