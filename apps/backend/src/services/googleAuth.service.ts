/**
 * Google Auth Service
 * Sprint 8 - US-067
 *
 * Manages OAuth2 authentication with Google Calendar API
 */

import { google, type Auth } from 'googleapis';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { encrypt, decrypt } from '../utils/tokenEncryption.utils.js';
import { BadRequestError, NotFoundError } from '../middlewares/error.middleware.js';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

/**
 * In-memory deduplication of concurrent token refresh requests.
 * If two requests arrive simultaneously for the same user, only one
 * HTTP call is made to Google — both callers await the same Promise.
 * This prevents "invalid_grant" errors caused by rapid double-refresh.
 */
const refreshInFlight = new Map<string, Promise<string>>();

/**
 * Redirect URI del flujo mobile: el endpoint del API que hace el exchange y
 * responde 302 → horus://. Debe estar registrado en Google Cloud Console y
 * coincidir entre generateAuthUrl y getToken (Google valida ambos).
 */
function getMobileRedirectUri(): string {
  return (
    env.GOOGLE_MOBILE_REDIRECT_URI ??
    new URL('/api/sync/google-calendar/callback', env.FRONTEND_URL).toString()
  );
}

/**
 * Creates OAuth2 client
 */
function getOAuth2Client(platform: 'web' | 'mobile' = 'web') {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new BadRequestError(
      'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI'
    );
  }

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    platform === 'mobile' ? getMobileRedirectUri() : env.GOOGLE_REDIRECT_URI
  );
}

export const googleAuthService = {
  /**
   * Generates authorization URL for OAuth2 flow
   * @param isReconnect - Whether this is a reconnection (skip forcing consent)
   * @param platform - 'mobile' viaja en el state para que la página de
   *   callback (web SPA) sepa redirigir a la app via deep link horus://
   */
  async generateAuthUrl(
    userId: string,
    isReconnect: boolean = false,
    platform: 'web' | 'mobile' = 'web'
  ): Promise<string> {
    const oauth2Client = getOAuth2Client(platform);

    // Check if user already has a connection
    if (!isReconnect) {
      const existingSetting = await prisma.syncSetting.findUnique({
        where: { userId },
      });
      isReconnect = !!existingSetting?.googleRefreshToken;
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: GOOGLE_SCOPES,
      // userId (+ plataforma) para el callback; los ids son UUID así que ':'
      // nunca aparece en el userId
      state: platform === 'mobile' ? `${userId}:mobile` : userId,
      // Only force consent on first connection
      // This prevents hitting Google's 50 refresh token limit per user
      prompt: isReconnect ? 'select_account' : 'consent',
    });

    return authUrl;
  },

  /**
   * Exchanges authorization code for tokens
   */
  async exchangeCodeForTokens(userId: string, code: string, platform: 'web' | 'mobile' = 'web') {
    // El redirect_uri del exchange debe ser el mismo que el del authUrl
    const oauth2Client = getOAuth2Client(platform);

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new BadRequestError('No access token received from Google');
      }

      // Encrypt tokens before storing
      const encryptedAccessToken = encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

      // Default to 1 hour if Google doesn't return expiry_date (should always return it)
      const expiryDate = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      // Upsert SyncSetting
      await prisma.syncSetting.upsert({
        where: { userId },
        create: {
          userId,
          googleCalendarEnabled: true,
          googleAccessToken: encryptedAccessToken,
          googleRefreshToken: encryptedRefreshToken,
          googleTokenExpiresAt: expiryDate,
        },
        update: {
          googleCalendarEnabled: true,
          googleAccessToken: encryptedAccessToken,
          googleRefreshToken: encryptedRefreshToken,
          googleTokenExpiresAt: expiryDate,
        },
      });

      return { success: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new BadRequestError(
        error.message || 'Failed to exchange authorization code for tokens'
      );
    }
  },

  /**
   * Refreshes access token using refresh token.
   * Uses in-memory promise deduplication to prevent concurrent refresh race conditions.
   */
  async refreshAccessToken(userId: string): Promise<string> {
    // If a refresh is already in progress for this user, wait for it instead of
    // making a second request to Google (which could invalidate the first token).
    const existing = refreshInFlight.get(userId);
    if (existing) {
      return existing;
    }

    const promise = this._doRefreshAccessToken(userId);
    refreshInFlight.set(userId, promise);

    try {
      return await promise;
    } finally {
      refreshInFlight.delete(userId);
    }
  },

  /**
   * Internal: performs the actual token refresh against Google's API.
   */
  async _doRefreshAccessToken(userId: string): Promise<string> {
    const syncSetting = await prisma.syncSetting.findUnique({
      where: { userId },
    });

    if (!syncSetting || !syncSetting.googleRefreshToken) {
      throw new NotFoundError('No refresh token available. Please reconnect Google Calendar.');
    }

    // Guard: if another concurrent request already refreshed the token and it's
    // still valid (> 5 min), skip the Google round-trip and return the current token.
    const BUFFER_MS = 5 * 60 * 1000;
    if (
      syncSetting.googleAccessToken &&
      syncSetting.googleTokenExpiresAt &&
      syncSetting.googleTokenExpiresAt.getTime() - BUFFER_MS > Date.now()
    ) {
      return decrypt(syncSetting.googleAccessToken);
    }

    const oauth2Client = getOAuth2Client();

    try {
      const refreshToken = decrypt(syncSetting.googleRefreshToken);

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new BadRequestError('Failed to refresh access token');
      }

      const encryptedAccessToken = encrypt(credentials.access_token);
      const expiryDate = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await prisma.syncSetting.update({
        where: { userId },
        data: {
          googleAccessToken: encryptedAccessToken,
          googleTokenExpiresAt: expiryDate,
        },
      });

      return credentials.access_token;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error refreshing access token:', error);

      // Only disconnect on true revocation — NOT on generic network errors (400, timeout, etc.)
      const errorMessage = error.message || '';
      const isIrrecoverableError =
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('Token has been expired or revoked') ||
        errorMessage.includes('Token has been revoked');

      if (isIrrecoverableError) {
        console.error(`Irrecoverable token error for user ${userId}. Disconnecting...`);

        await prisma.syncSetting.update({
          where: { userId },
          data: {
            googleCalendarEnabled: false,
            googleAccessToken: null,
            googleRefreshToken: null,
            googleTokenExpiresAt: null,
          },
        });

        await prisma.event.updateMany({
          where: { userId, syncWithGoogle: true },
          data: { syncWithGoogle: false },
        });

        throw new BadRequestError(
          'Your Google Calendar connection has expired. Please reconnect to continue syncing.'
        );
      }

      throw new BadRequestError(error.message || 'Failed to refresh access token');
    }
  },

  /**
   * Revokes Google OAuth tokens and disconnects
   */
  async disconnect(userId: string) {
    const syncSetting = await prisma.syncSetting.findUnique({
      where: { userId },
    });

    if (!syncSetting) {
      throw new NotFoundError('Google Calendar not connected');
    }

    const oauth2Client = getOAuth2Client();

    // Try to revoke token in Google
    if (syncSetting.googleAccessToken) {
      try {
        const accessToken = decrypt(syncSetting.googleAccessToken);
        oauth2Client.setCredentials({ access_token: accessToken });
        await oauth2Client.revokeCredentials();
      } catch (error) {
        console.error('Error revoking Google token (continuing anyway):', error);
        // Continue even if revocation fails
      }
    }

    // Update sync setting
    await prisma.syncSetting.update({
      where: { userId },
      data: {
        googleCalendarEnabled: false,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
      },
    });

    // Mark all synced events as local only. googleEventId también se limpia:
    // dejarlo colgado rompe una reconexión posterior (updateGoogleEvent
    // intentaría actualizar un evento de un calendario ya desvinculado).
    await prisma.event.updateMany({
      where: {
        userId,
        OR: [{ syncWithGoogle: true }, { googleEventId: { not: null } }],
      },
      data: {
        syncWithGoogle: false,
        googleEventId: null,
        syncRetryCount: 0,
        syncNextRetryAt: null,
        syncLastError: null,
      },
    });

    return { success: true, message: 'Google Calendar disconnected successfully' };
  },

  /**
   * Gets sync status for user
   */
  async getStatus(userId: string) {
    const syncSetting = await prisma.syncSetting.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!syncSetting) {
      return {
        isConnected: false,
        googleEmail: undefined,
        lastSyncAt: null,
        hasValidToken: false,
        needsReconnect: false,
      };
    }

    // Check if has refresh token (the only thing that truly matters for long-term connectivity)
    const hasRefreshToken = !!syncSetting.googleRefreshToken;

    // Access token validity with 5-minute buffer (same as Microsoft implementation)
    const now = new Date();
    const BUFFER_MS = 5 * 60 * 1000;
    const tokenValid = syncSetting.googleTokenExpiresAt
      ? syncSetting.googleTokenExpiresAt.getTime() - BUFFER_MS > now.getTime()
      : false; // If no expiry date stored, force a refresh on next use

    // needsReconnect = true ONLY when there's no refresh token (can't auto-renew).
    // An expired access token is fine — getAuthenticatedClient() refreshes it automatically.
    const needsReconnect = syncSetting.googleCalendarEnabled && !hasRefreshToken;

    return {
      isConnected: syncSetting.googleCalendarEnabled,
      googleEmail: syncSetting.user.email, // Get email from user relation
      lastSyncAt: syncSetting.lastSyncAt,
      hasValidToken: tokenValid && hasRefreshToken,
      needsReconnect,
    };
  },

  /**
   * Gets authenticated OAuth2 client for user
   * Automatically refreshes token if expired
   */
  async getAuthenticatedClient(userId: string): Promise<Auth.OAuth2Client> {
    const syncSetting = await prisma.syncSetting.findUnique({
      where: { userId },
    });

    if (!syncSetting || !syncSetting.googleAccessToken) {
      throw new NotFoundError('Google Calendar not connected');
    }

    const oauth2Client = getOAuth2Client();

    // Refresh proactively if token expires within 5 minutes (same buffer as Microsoft)
    const now = new Date();
    const BUFFER_MS = 5 * 60 * 1000;
    const expiresAt = syncSetting.googleTokenExpiresAt;

    if (!expiresAt || expiresAt.getTime() - BUFFER_MS <= now.getTime()) {
      // Token expired or about to expire — refresh it
      const newAccessToken = await this.refreshAccessToken(userId);
      oauth2Client.setCredentials({ access_token: newAccessToken });
    } else {
      // Token still valid
      const accessToken = decrypt(syncSetting.googleAccessToken);
      oauth2Client.setCredentials({ access_token: accessToken });
    }

    return oauth2Client;
  },

  /**
   * Resets sync timestamp to force full sync
   */
  async resetSyncTimestamp(userId: string) {
    await prisma.syncSetting.update({
      where: { userId },
      data: {
        lastSyncAt: null,
      },
    });
  },
};
