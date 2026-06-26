/**
 * Email Verification Service (S-01.3)
 *
 * Verification is NON-BLOCKING: a freshly registered user can log in and use
 * the app immediately. Verification is required only before paid actions
 * (enforced later in the billing/entitlements layer).
 *
 * Flow:
 * 1. sendVerification(userId): generate a random token, store its SHA-256 hash,
 *    email the plaintext token embedded in the verify URL. No-op if the user is
 *    already verified.
 * 2. verifyEmail(token): hash the token, look it up, validate not expired / not
 *    used, set User.emailVerifiedAt = now() and mark the token used. Idempotent
 *    for an already-verified user.
 * 3. requestResend(email): silent no-op for unknown / already-verified emails
 *    (prevents account enumeration), otherwise re-sends.
 */

import { randomBytes, createHash } from 'crypto';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { emailService } from './email.service.js';

const TOKEN_BYTES = 32; // 256 bits -> 64-char hex token
const TOKEN_TTL_MINUTES = 60 * 24; // 24 hours

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

function buildVerifyUrl(token: string): string {
  const base = env.FRONTEND_URL.endsWith('/') ? env.FRONTEND_URL.slice(0, -1) : env.FRONTEND_URL;
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Issues a verification token for the given user and emails it. No-op if the
 * user does not exist or is already verified.
 */
export async function sendVerification(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) return;

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  // Invalidate previous outstanding tokens, then issue a fresh one.
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  const verifyUrl = buildVerifyUrl(token);
  const rendered = emailService.renderVerificationEmail({
    userName: user.name,
    verifyUrl,
    expiresInMinutes: TOKEN_TTL_MINUTES,
  });

  await emailService.sendEmail({
    to: user.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}

export class EmailVerificationError extends Error {
  constructor(public reason: 'invalid' | 'expired' | 'used') {
    super(`Email verification token ${reason}`);
    this.name = 'EmailVerificationError';
  }
}

/**
 * Consumes a one-time token and marks the user's email as verified.
 */
export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) throw new EmailVerificationError('invalid');
  if (record.usedAt !== null) throw new EmailVerificationError('used');
  if (record.expiresAt.getTime() < Date.now()) throw new EmailVerificationError('expired');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info('[emailVerification] email verified', { userId: record.userId });
}

/**
 * Re-sends a verification email. Silent no-op for unknown or already-verified
 * emails to avoid leaking which addresses are registered.
 */
export async function requestResend(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user || user.emailVerifiedAt) {
    logger.info('[emailVerification] resend no-op', { email: normalizedEmail });
    return;
  }

  await sendVerification(user.id);
}

export const emailVerificationService = {
  sendVerification,
  verifyEmail,
  requestResend,
};
