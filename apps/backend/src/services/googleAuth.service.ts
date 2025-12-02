/**
 * Google Auth Service
 * Sprint 8 - US-067
 *
 * Manages OAuth2 authentication with Google Calendar API
 */

import { google, type Auth } from 'googleapis';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import crypto from 'crypto';
import { BadRequestError, NotFoundError } from '../middlewares/error.middleware.js';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

/**
 * Encrypts a string using AES-256-GCM
 */
function encrypt(text: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with encrypt()
 */
function decrypt(encryptedText: string): string {
  if (!env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Creates OAuth2 client
 */
function getOAuth2Client() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new BadRequestError(
      'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI'
    );
  }

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export const googleAuthService = {
  /**
   * Generates authorization URL for OAuth2 flow
   */
  generateAuthUrl(userId: string): string {
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: GOOGLE_SCOPES,
      state: userId, // Pass userId to callback
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return authUrl;
  },

  /**
   * Exchanges authorization code for tokens
   */
  async exchangeCodeForTokens(userId: string, code: string) {
    const oauth2Client = getOAuth2Client();

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new BadRequestError('No access token received from Google');
      }

      // Encrypt tokens before storing
      const encryptedAccessToken = encrypt(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

      const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

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
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new BadRequestError(
        error.message || 'Failed to exchange authorization code for tokens'
      );
    }
  },

  /**
   * Refreshes access token using refresh token
   */
  async refreshAccessToken(userId: string) {
    const syncSetting = await prisma.syncSetting.findUnique({
      where: { userId },
    });

    if (!syncSetting || !syncSetting.googleRefreshToken) {
      throw new NotFoundError('No refresh token available. Please reconnect Google Calendar.');
    }

    const oauth2Client = getOAuth2Client();

    try {
      // Decrypt refresh token
      const refreshToken = decrypt(syncSetting.googleRefreshToken);

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new BadRequestError('Failed to refresh access token');
      }

      // Encrypt new access token
      const encryptedAccessToken = encrypt(credentials.access_token);
      const expiryDate = credentials.expiry_date ? new Date(credentials.expiry_date) : null;

      // Update access token in DB
      await prisma.syncSetting.update({
        where: { userId },
        data: {
          googleAccessToken: encryptedAccessToken,
          googleTokenExpiresAt: expiryDate,
        },
      });

      return credentials.access_token;
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
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

    // Mark all synced events as local only
    await prisma.event.updateMany({
      where: {
        userId,
        syncWithGoogle: true,
      },
      data: {
        syncWithGoogle: false,
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
    });

    if (!syncSetting) {
      return {
        googleCalendarEnabled: false,
        lastSyncAt: null,
        nextSyncAt: null,
      };
    }

    return {
      googleCalendarEnabled: syncSetting.googleCalendarEnabled,
      lastSyncAt: syncSetting.lastSyncAt,
      nextSyncAt: null, // TODO: Calculate based on sync job schedule
      tokenExpiresAt: syncSetting.googleTokenExpiresAt,
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

    // Check if token is expired
    const now = new Date();
    const expiresAt = syncSetting.googleTokenExpiresAt;

    if (expiresAt && expiresAt <= now) {
      // Token expired, refresh it
      const newAccessToken = await this.refreshAccessToken(userId);
      oauth2Client.setCredentials({ access_token: newAccessToken });
    } else {
      // Token still valid
      const accessToken = decrypt(syncSetting.googleAccessToken);
      oauth2Client.setCredentials({ access_token: accessToken });
    }

    return oauth2Client;
  },
};
