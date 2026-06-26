import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    emailVerificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('./email.service.js', () => ({
  emailService: {
    sendEmail: vi.fn().mockResolvedValue(undefined),
    renderVerificationEmail: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
  },
}));

import {
  sendVerification,
  verifyEmail,
  requestResend,
  EmailVerificationError,
} from './emailVerification.service.js';
import { prisma } from '../lib/prisma.js';
import { emailService } from './email.service.js';

const p = vi.mocked(prisma, true);
const mail = vi.mocked(emailService, true);

beforeEach(() => {
  vi.clearAllMocks();
  p.$transaction.mockResolvedValue([] as never);
});

describe('sendVerification', () => {
  it('is a no-op when the user is already verified', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      emailVerifiedAt: new Date(),
    } as never);

    await sendVerification('u1');

    expect(p.$transaction).not.toHaveBeenCalled();
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it('issues a token and sends the email for an unverified user', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      emailVerifiedAt: null,
    } as never);

    await sendVerification('u1');

    expect(p.$transaction).toHaveBeenCalledTimes(1);
    expect(mail.renderVerificationEmail).toHaveBeenCalledOnce();
    expect(mail.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.c' }));
  });
});

describe('verifyEmail', () => {
  it('throws "invalid" when the token is unknown', async () => {
    p.emailVerificationToken.findUnique.mockResolvedValue(null as never);
    await expect(verifyEmail('nope')).rejects.toMatchObject({
      name: 'EmailVerificationError',
      reason: 'invalid',
    });
  });

  it('throws "used" when the token was already consumed', async () => {
    p.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 10000),
      usedAt: new Date(),
    } as never);
    await expect(verifyEmail('x')).rejects.toMatchObject({ reason: 'used' });
  });

  it('throws "expired" for an expired token', async () => {
    p.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      expiresAt: new Date(Date.now() - 10000),
      usedAt: null,
    } as never);
    await expect(verifyEmail('x')).rejects.toBeInstanceOf(EmailVerificationError);
  });

  it('marks the email verified for a valid token', async () => {
    p.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      expiresAt: new Date(Date.now() + 10000),
      usedAt: null,
    } as never);

    await verifyEmail('valid');

    expect(p.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('requestResend', () => {
  it('is a no-op for an unknown email', async () => {
    p.user.findUnique.mockResolvedValue(null as never);
    await requestResend('ghost@b.c');
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });

  it('is a no-op for an already-verified email', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'u1',
      emailVerifiedAt: new Date(),
    } as never);
    await requestResend('a@b.c');
    expect(mail.sendEmail).not.toHaveBeenCalled();
  });
});
