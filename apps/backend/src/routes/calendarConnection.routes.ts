/**
 * Calendar Connection Routes
 * Sprint 15 - Multi-Calendar Support
 *
 * OAuth2 and synchronization endpoints for Microsoft Calendar.
 */

import { Router, type IRouter } from 'express';
import { calendarConnectionController } from '../controllers/calendarConnection.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// Microsoft Calendar OAuth2 endpoints
router.post('/microsoft/connect', authMiddleware, calendarConnectionController.connectMicrosoft);
router.get('/microsoft/callback', calendarConnectionController.handleMicrosoftCallback); // No auth - OAuth redirect
router.post(
  '/microsoft/disconnect',
  authMiddleware,
  calendarConnectionController.disconnectMicrosoft
);
router.get('/microsoft/status', authMiddleware, calendarConnectionController.getMicrosoftStatus);

// Microsoft Calendar sync endpoint
router.post('/microsoft/sync', authMiddleware, calendarConnectionController.syncFromMicrosoft);

export default router;
