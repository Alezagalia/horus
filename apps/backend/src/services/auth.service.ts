import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { CURRENT_TERMS_VERSION } from '@horus/shared';
import { categoryService } from './category.service.js';
import { habitMomentService } from './habitMoment.service.js';

const SALT_ROUNDS = 12;

// Per-account login lockout (S-01.4). Complements the per-IP rate limiter:
// after this many consecutive failed logins the account is locked for a cool-off
// window, which blunts distributed brute force that rotates source IPs.
export const LOGIN_MAX_ATTEMPTS = 10;
export const LOGIN_LOCK_MINUTES = 15;

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  hourlyRate?: unknown;
  emailVerifiedAt?: Date | null;
  onboardingCompletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });

    return { accessToken, refreshToken };
  },

  verifyAccessToken(token: string): TokenPayload {
    // Fijamos el algoritmo esperado para evitar ataques de confusión de alg.
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  },

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  },

  /**
   * Hash de un refresh token para guardarlo en reposo. Usamos SHA-256 (no bcrypt:
   * un JWT supera los 72 bytes que bcrypt trunca, y al ser de alta entropía no
   * necesita salt/stretching). Así, si la DB se compromete, los tokens guardados
   * no son reutilizables directamente.
   */
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  },

  /** Compara un refresh token presentado contra el hash guardado, en tiempo
   * constante. Devuelve false si no hay hash guardado (sesión cerrada). */
  refreshTokenMatches(providedToken: string, storedHash: string | null): boolean {
    if (!storedHash) return false;
    const provided = Buffer.from(this.hashRefreshToken(providedToken), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    if (provided.length !== stored.length) return false;
    return timingSafeEqual(provided, stored);
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async createUser(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<UserWithoutPassword> {
    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        // Consent captured at registration (validated upstream by registerSchema).
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
        acceptedTermsAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerifiedAt: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Seed default categories (US-019)
    try {
      await categoryService.createDefaultCategories(user.id);
    } catch (error) {
      console.error(`[US-019] Failed to seed default categories for user ${user.id}:`, error);
    }

    // Seed default habit moments
    try {
      await habitMomentService.createDefaultMoments(user.id);
    } catch (error) {
      console.error(`Failed to seed default habit moments for user ${user.id}:`, error);
    }

    return user;
  },

  async updateProfile(
    userId: string,
    data: { name?: string; hourlyRate?: number | null; onboardingCompleted?: true }
  ): Promise<UserWithoutPassword> {
    const { onboardingCompleted, ...rest } = data;
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...rest,
        ...(onboardingCompleted && { onboardingCompletedAt: new Date() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        hourlyRate: true,
        emailVerifiedAt: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
    opts?: { touchLastLogin?: boolean }
  ): Promise<void> {
    // Guardamos el HASH del token, nunca el token en claro (ver hashRefreshToken).
    // `null` significa cerrar sesión (revocar).
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: refreshToken ? this.hashRefreshToken(refreshToken) : null,
        ...(opts?.touchLastLogin && { lastLoginAt: new Date() }),
      },
    });
  },

  /**
   * Returns the remaining lockout time in ms if the account is currently locked,
   * otherwise null. A past `lockedUntil` is treated as not locked.
   */
  getLockRemainingMs(user: { lockedUntil?: Date | null }): number | null {
    if (!user.lockedUntil) return null;
    const remaining = user.lockedUntil.getTime() - Date.now();
    return remaining > 0 ? remaining : null;
  },

  /**
   * Records a failed login. Increments the counter and, once it reaches the
   * threshold, locks the account for the cool-off window and resets the counter.
   */
  async recordFailedLogin(user: { id: string; failedLoginAttempts: number }): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;

    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000),
        },
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts },
    });
  },

  /**
   * Clears the failed-login counter and any lock after a successful login.
   * No-op write avoidance: only touches the row when there's something to reset.
   */
  async resetLoginAttempts(user: {
    id: string;
    failedLoginAttempts: number;
    lockedUntil?: Date | null;
  }): Promise<void> {
    if (user.failedLoginAttempts === 0 && !user.lockedUntil) return;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  },

  excludePassword<T extends { password?: string | null }>(user: T): Omit<T, 'password'> {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};
