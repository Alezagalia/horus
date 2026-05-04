/**
 * Calendar Connection Controller
 * Sprint 15 - Multi-Calendar Support
 *
 * HTTP handlers for Microsoft Calendar OAuth2 flow and synchronization.
 */

import { Request, Response, NextFunction } from 'express';
import { microsoftAuthService } from '../services/microsoftAuth.service.js';
import { microsoftCalendarSyncService } from '../services/microsoftCalendarSync.service.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const calendarConnectionController = {
  /**
   * POST /api/calendar-connections/microsoft/connect
   * Returns Microsoft OAuth2 authorization URL
   */
  async connectMicrosoft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const authUrl = await microsoftAuthService.generateAuthUrl(user.id);

      res.status(200).json({
        success: true,
        authUrl,
        message: 'Redirect user to this URL to authorize Microsoft Calendar access',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/calendar-connections/microsoft/callback
   * Receives OAuth2 callback, exchanges code for tokens, then closes the popup.
   */
  async handleMicrosoftCallback(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.status(200).send(buildCallbackHtml('error', String(oauthError)));
        return;
      }

      if (!code || !state) {
        res.status(200).send(buildCallbackHtml('error', 'Missing code or state parameter'));
        return;
      }

      const userId = state as string;
      await microsoftAuthService.exchangeCodeForTokens(userId, code as string);

      res.status(200).send(buildCallbackHtml('success'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      res.status(200).send(buildCallbackHtml('error', error.message || 'Authentication failed'));
    }
  },

  /**
   * POST /api/calendar-connections/microsoft/disconnect
   * Revokes Microsoft Calendar connection and deletes imported events
   */
  async disconnectMicrosoft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const result = await microsoftAuthService.disconnect(user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/calendar-connections/microsoft/status
   * Returns current Microsoft Calendar connection status
   */
  async getMicrosoftStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const status = await microsoftAuthService.getStatus(user.id);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/calendar-connections/microsoft/sync
   * Manually triggers synchronization from Microsoft Calendar
   */
  async syncFromMicrosoft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const result = await microsoftCalendarSyncService.syncFromMicrosoft(user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Builds an HTML page for the OAuth popup that posts a message to the opener and closes.
 */
function buildCallbackHtml(type: 'success' | 'error', errorMessage?: string): string {
  if (type === 'success') {
    return `<!DOCTYPE html>
<html>
<head><title>Conectando Microsoft Calendar...</title></head>
<body>
<p>Conectado exitosamente. Esta ventana se cerrará automáticamente.</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'microsoft-calendar-connected' }, window.location.origin);
    }
  } catch (e) {}
  window.close();
</script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head><title>Error al conectar</title></head>
<body>
<p>Error al conectar con Microsoft Calendar. Puede cerrar esta ventana.</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'microsoft-calendar-error', error: ${JSON.stringify(errorMessage || 'Unknown error')} }, window.location.origin);
    }
  } catch (e) {}
  window.close();
</script>
</body>
</html>`;
}
