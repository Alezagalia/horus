import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { CURRENT_TERMS_VERSION } from '@horus/shared';
import { categoryService } from './category.service.js';
import { habitMomentService } from './habitMoment.service.js';
import { logger } from '../lib/logger.js';

export type GoogleSignInErrorReason = 'not_configured' | 'invalid_token' | 'terms_required';

export class GoogleSignInError extends Error {
  constructor(
    public readonly reason: GoogleSignInErrorReason,
    message?: string
  ) {
    super(message ?? reason);
    this.name = 'GoogleSignInError';
  }
}

export interface GoogleIdentity {
  googleId: string;
  email: string;
  name: string;
}

// Sin credenciales: verifyIdToken solo necesita validar firma + audience,
// no hace llamadas autenticadas.
const oauthClient = new OAuth2Client();

function getAllowedAudiences(): string[] {
  const raw = env.GOOGLE_SIGNIN_CLIENT_IDS ?? env.GOOGLE_CLIENT_ID ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const googleSignInService = {
  /**
   * Verifica un id_token de Google (firma, expiración y audience) y extrae la
   * identidad. Exige email verificado por Google — es la base del auto-linking
   * por email.
   */
  async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    const audience = getAllowedAudiences();
    if (audience.length === 0) {
      throw new GoogleSignInError('not_configured', 'Google Sign-In no está configurado');
    }

    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({ idToken, audience });
      payload = ticket.getPayload();
    } catch (error) {
      logger.warn('[googleSignIn] id_token verification failed', { error: String(error) });
      throw new GoogleSignInError('invalid_token');
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new GoogleSignInError('invalid_token');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name?.trim() || payload.email.split('@')[0],
    };
  },

  /**
   * Login/registro con identidad Google ya verificada:
   * - user con ese googleId → login directo.
   * - email existente → linkea googleId (Google probó la propiedad del email)
   *   y marca el email como verificado.
   * - email nuevo → requiere acceptedTerms; crea cuenta sin password.
   */
  async signInWithGoogle(identity: GoogleIdentity, acceptedTerms?: boolean) {
    const byGoogleId = await prisma.user.findUnique({ where: { googleId: identity.googleId } });
    if (byGoogleId) return byGoogleId;

    const byEmail = await prisma.user.findUnique({ where: { email: identity.email } });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: identity.googleId,
          ...(byEmail.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
          // La identidad quedó probada por Google: limpiamos el lockout.
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    if (acceptedTerms !== true) {
      throw new GoogleSignInError('terms_required');
    }

    const user = await prisma.user.create({
      data: {
        email: identity.email,
        name: identity.name,
        password: null,
        googleId: identity.googleId,
        emailVerifiedAt: new Date(),
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
        acceptedTermsAt: new Date(),
      },
    });

    // Seed defaults (mismo comportamiento que el registro clásico, una sola vez).
    try {
      await categoryService.createDefaultCategories(user.id);
    } catch (error) {
      logger.error(`[googleSignIn] Failed to seed default categories for user ${user.id}`, error);
    }
    try {
      await habitMomentService.createDefaultMoments(user.id);
    } catch (error) {
      logger.error(`[googleSignIn] Failed to seed default moments for user ${user.id}`, error);
    }

    return user;
  },
};
