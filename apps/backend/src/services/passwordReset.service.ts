/**
 * Password Reset Service
 *
 * Flow:
 * 1. requestReset(email):
 *    - Look up user by email.
 *    - If not found: silent no-op (caller still returns 200 to prevent email
 *      enumeration).
 *    - Otherwise: generate a random token, store its SHA-256 hash, send email
 *      with the plaintext token embedded in the reset URL.
 * 2. resetPassword(token, newPassword):
 *    - Hash the supplied token and look it up.
 *    - Validate not expired, not used.
 *    - Update User.password (bcrypt hash) and mark token usedAt = now().
 *    - Invalidate any other outstanding tokens for that user.
 */

import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { emailService } from './email.service.js';

const TOKEN_BYTES = 32; // 256 bits -> 64-char hex token
const TOKEN_TTL_MINUTES = 60;
const BCRYPT_ROUNDS = 10;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

function buildResetUrl(token: string): string {
  // FRONTEND_URL is validated as a URL by env schema, so this is safe.
  const base = env.FRONTEND_URL.endsWith('/') ? env.FRONTEND_URL.slice(0, -1) : env.FRONTEND_URL;
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function requestReset(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    // Silent no-op: don't reveal whether the email is registered.
    logger.info('[passwordReset] request for unknown email', { email: normalizedEmail });
    return;
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = buildResetUrl(token);
  const rendered = emailService.renderPasswordResetEmail({
    userName: user.name,
    resetUrl,
    expiresInMinutes: TOKEN_TTL_MINUTES,
  });

  await emailService.sendEmail({
    to: user.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}

export class PasswordResetError extends Error {
  constructor(public reason: 'invalid' | 'expired' | 'used') {
    super(`Password reset token ${reason}`);
    this.name = 'PasswordResetError';
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!record) {
    throw new PasswordResetError('invalid');
  }
  if (record.usedAt !== null) {
    throw new PasswordResetError('used');
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new PasswordResetError('expired');
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Transaction: update password + mark token used + invalidate any other
  // unused tokens for this user (defense against tokens stolen pre-reset).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info('[passwordReset] password updated', { userId: record.userId });
}

export const passwordResetService = {
  requestReset,
  resetPassword,
};
