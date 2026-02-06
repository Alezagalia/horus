/**
 * Sync Controller
 * Sprint 8 - US-067
 *
 * Handles Google Calendar OAuth2 flow and synchronization
 */

import { Request, Response, NextFunction } from 'express';
import { googleAuthService } from '../services/googleAuth.service.js';
import { googleCalendarSyncService } from '../services/googleCalendarSync.service.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const syncController = {
  /**
   * POST /api/sync/google-calendar/connect
   * Initiates OAuth2 flow by generating Google authorization URL
   */
  async connectGoogleCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const userId = user.id;

      const authUrl = await googleAuthService.generateAuthUrl(userId);

      res.status(200).json({
        success: true,
        authUrl,
        message: 'Redirect user to this URL to authorize Google Calendar access',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/sync/google-calendar/callback
   * Receives OAuth2 callback with authorization code
   * Exchanges code for tokens and stores them
   */
  async handleGoogleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        res.status(400).json({
          success: false,
          message: 'Missing code or state parameter',
        });
        return;
      }

      const userId = state as string;

      await googleAuthService.exchangeCodeForTokens(userId, code as string);

      res.status(200).json({
        success: true,
        message: 'Google Calendar connected successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/sync/google-calendar/disconnect
   * Disconnects Google Calendar by revoking tokens
   */
  async disconnectGoogleCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const userId = user.id;

      const result = await googleAuthService.disconnect(userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/sync/google-calendar/status
   * Gets current Google Calendar sync status
   */
  async getGoogleCalendarStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const userId = user.id;

      const status = await googleAuthService.getStatus(userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/sync/google-calendar/sync
   * Manually triggers synchronization from Google Calendar to local
   */
  async syncFromGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const userId = user.id;

      const result = await googleCalendarSyncService.syncFromGoogle(userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/sync/google-calendar/reset-sync
   * Resets sync timestamp to force full sync (for testing/debugging)
   */
  async resetSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const userId = user.id;

      await googleAuthService.resetSyncTimestamp(userId);

      res.status(200).json({
        success: true,
        message: 'Sync timestamp reset. Next sync will be a full sync.',
      });
    } catch (error) {
      next(error);
    }
  },
};
