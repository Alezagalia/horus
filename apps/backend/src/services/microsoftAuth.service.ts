/**
 * Microsoft Auth Service
 * Sprint 15 - Multi-Calendar Support
 *
 * Manages OAuth2 authentication with Microsoft Identity Platform
 * for Microsoft Calendar (Outlook) integration.
 */

import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { encrypt, decrypt } from '../utils/tokenEncryption.utils.js';
import { BadRequestError, NotFoundError } from '../middlewares/error.middleware.js';

const MS_AUTH_BASE = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const MS_GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

const MICROSOFT_SCOPES = [
  'offline_access',
  'openid',
  'profile',
  'User.Read',
  'Calendars.ReadWrite',
].join(' ');

function getMicrosoftCredentials() {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI } = env;
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET || !MICROSOFT_REDIRECT_URI) {
    throw new BadRequestError(
      'Microsoft OAuth credentials not configured. Please set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_REDIRECT_URI'
    );
  }
  return {
    clientId: MICROSOFT_CLIENT_ID,
    clientSecret: MICROSOFT_CLIENT_SECRET,
    redirectUri: MICROSOFT_REDIRECT_URI,
  };
}

export const microsoftAuthService = {
  /**
   * Generates Microsoft OAuth2 authorization URL
   */
  async generateAuthUrl(userId: string): Promise<string> {
    const { clientId, redirectUri } = getMicrosoftCredentials();

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: MICROSOFT_SCOPES,
      response_mode: 'query',
      state: userId,
      prompt: 'select_account',
    });

    return `${MS_AUTH_BASE}/authorize?${params}`;
  },

  /**
   * Exchanges authorization code for tokens and stores in CalendarConnection
   */
  async exchangeCodeForTokens(userId: string, code: string) {
    const { clientId, clientSecret, redirectUri } = getMicrosoftCredentials();

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: MICROSOFT_SCOPES,
    });

    const tokenResponse = await fetch(`${MS_AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (await tokenResponse.json()) as any;
      throw new BadRequestError(
        error.error_description || 'Failed to exchange authorization code for Microsoft tokens'
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    if (!tokens.access_token) {
      throw new BadRequestError('No access token received from Microsoft');
    }

    // Get user email from Microsoft Graph
    let email: string | undefined;
    try {
      const userResponse = await fetch(`${MS_GRAPH_BASE}/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userResponse.ok) {
        const user = (await userResponse.json()) as {
          mail?: string;
          userPrincipalName?: string;
        };
        email = user.mail || user.userPrincipalName;
      }
    } catch {
      // Non-critical: continue without email
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

    await prisma.calendarConnection.upsert({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
      create: {
        userId,
        provider: 'MICROSOFT',
        email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        isActive: true,
      },
      update: {
        email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        isActive: true,
        syncCursor: null, // Reset delta cursor on reconnect to force full sync
      },
    });

    return { success: true };
  },

  /**
   * Refreshes access token using refresh token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
    });

    if (!connection?.refreshToken) {
      throw new NotFoundError('No refresh token available. Please reconnect Microsoft Calendar.');
    }

    const { clientId, clientSecret } = getMicrosoftCredentials();
    const refreshToken = decrypt(connection.refreshToken);

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: MICROSOFT_SCOPES,
    });

    const tokenResponse = await fetch(`${MS_AUTH_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (await tokenResponse.json()) as any;
      const isIrrecoverable =
        error.error === 'invalid_grant' ||
        (error.error_description || '').includes('expired') ||
        (error.error_description || '').includes('revoked');

      if (isIrrecoverable) {
        await prisma.calendarConnection.update({
          where: { userId_provider: { userId, provider: 'MICROSOFT' } },
          data: { isActive: false, accessToken: null, refreshToken: null },
        });
        throw new BadRequestError(
          'Your Microsoft Calendar connection has expired. Please reconnect to continue syncing.'
        );
      }

      throw new BadRequestError(
        error.error_description || 'Failed to refresh Microsoft access token'
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
    };

    const encryptedAccessToken = encrypt(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.calendarConnection.update({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
      data: { accessToken: encryptedAccessToken, tokenExpiresAt: expiresAt },
    });

    return tokens.access_token;
  },

  /**
   * Returns a valid access token, refreshing if needed (5-min buffer)
   */
  async getAccessToken(userId: string): Promise<string> {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
    });

    if (!connection?.accessToken || !connection.isActive) {
      throw new NotFoundError('Microsoft Calendar not connected');
    }

    const now = new Date();
    const BUFFER_MS = 5 * 60 * 1000;
    const expiresAt = connection.tokenExpiresAt;

    if (expiresAt && expiresAt.getTime() - BUFFER_MS <= now.getTime()) {
      return await this.refreshAccessToken(userId);
    }

    return decrypt(connection.accessToken);
  },

  /**
   * Revokes connection and deletes associated events
   */
  async disconnect(userId: string) {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
    });

    if (!connection) {
      throw new NotFoundError('Microsoft Calendar not connected');
    }

    // Delete events imported from this connection
    await prisma.event.deleteMany({
      where: { calendarConnectionId: connection.id },
    });

    await prisma.calendarConnection.delete({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
    });

    return { success: true, message: 'Microsoft Calendar disconnected successfully' };
  },

  /**
   * Gets sync status for user's Microsoft Calendar connection
   */
  async getStatus(userId: string) {
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'MICROSOFT' } },
    });

    if (!connection || !connection.isActive) {
      return { isConnected: false, email: null, lastSyncAt: null, needsReconnect: false };
    }

    const now = new Date();
    const tokenValid = connection.tokenExpiresAt ? connection.tokenExpiresAt > now : true;
    const hasRefreshToken = !!connection.refreshToken;
    const needsReconnect = !hasRefreshToken || !tokenValid;

    return {
      isConnected: true,
      email: connection.email,
      lastSyncAt: connection.lastSyncAt,
      needsReconnect,
    };
  },
};
