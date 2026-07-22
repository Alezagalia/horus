import { describe, it, expect, beforeEach, vi } from 'vitest';

const { verifyIdTokenMock } = vi.hoisted(() => ({ verifyIdTokenMock: vi.fn() }));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdTokenMock;
  },
}));

vi.mock('../config/env.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../config/env.js')>();
  return { env: { ...mod.env, GOOGLE_SIGNIN_CLIENT_IDS: 'test-web-client-id' } };
});

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../middlewares/rate-limit.middleware.js', () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  generalLimiter: (_req: any, _res: any, next: any) => next(),
  passwordResetLimiter: (_req: any, _res: any, next: any) => next(),
  sensitiveLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../services/dataExport.service.js', () => ({
  dataExportService: { exportUserData: vi.fn().mockResolvedValue({ exportedAt: 'now', user: {} }) },
}));

vi.mock('../services/accountDeletion.service.js', () => ({
  accountDeletionService: { deleteAccount: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../middlewares/auth.middleware.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@horus.app', name: 'Test User' };
    next();
  },
}));

vi.mock('../services/passwordReset.service.js', () => ({
  passwordResetService: {
    requestReset: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
  },
  PasswordResetError: class PasswordResetError extends Error {
    reason: string;
    constructor(reason: string) {
      super(reason);
      this.reason = reason;
    }
  },
}));

vi.mock('../services/category.service.js', () => ({
  categoryService: { createDefaultCategories: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../services/habitMoment.service.js', () => ({
  habitMomentService: { createDefaultMoments: vi.fn().mockResolvedValue([]) },
}));

import request from 'supertest';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { createTestApp } from '../test/helpers/app.factory.js';
import authRouter from './auth.routes.js';
import { authService } from '../services/auth.service.js';
import {
  createTestToken,
  createTestRefreshToken,
  TEST_USER_EMAIL,
  TEST_USER_ID,
} from '../test/helpers/jwt.helper.js';

const app = createTestApp(['/api/auth', authRouter]);
const p = vi.mocked(prisma, true);

const mockUserBase = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  name: 'Test User',
  password: '',
  refreshToken: null,
  hourlyRate: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(async () => {
  vi.clearAllMocks();
  mockUserBase.password = await bcrypt.hash('password123', 10);
});

describe('POST /api/auth/login', () => {
  it('returns 200 with tokens on valid credentials', async () => {
    p.user.findUnique.mockResolvedValue(mockUserBase as any);
    p.user.update.mockResolvedValue({ ...mockUserBase, refreshToken: 'new-rt' } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 on wrong password', async () => {
    p.user.findUnique.mockResolvedValue(mockUserBase as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when user not found', async () => {
    p.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'pass' });

    expect(res.status).toBe(401);
  });

  it('returns 429 when the account is temporarily locked', async () => {
    p.user.findUnique.mockResolvedValue({
      ...mockUserBase,
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
    } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: 'password123' });

    expect(res.status).toBe(429);
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 with guidance when the account is Google-only (no password)', async () => {
    p.user.findUnique.mockResolvedValue({ ...mockUserBase, password: null } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Google');
  });
});

describe('POST /api/auth/google', () => {
  const googlePayload = {
    sub: 'google-sub-123',
    email: 'google@horus.app',
    email_verified: true,
    name: 'Google User',
  };

  function mockValidTicket(payload = googlePayload) {
    verifyIdTokenMock.mockResolvedValue({ getPayload: () => payload });
  }

  it('returns 409 TERMS_ACCEPTANCE_REQUIRED for a new email without acceptedTerms', async () => {
    mockValidTicket();
    // Ni googleId ni email existen.
    p.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/google').send({ idToken: 'valid-token' });

    expect(res.status).toBe(409);
    expect(res.body.meta?.code).toBe('TERMS_ACCEPTANCE_REQUIRED');
    expect(p.user.create).not.toHaveBeenCalled();
  });

  it('creates a passwordless verified user when terms are accepted', async () => {
    mockValidTicket();
    p.user.findUnique.mockResolvedValue(null);
    p.user.create.mockResolvedValue({
      ...mockUserBase,
      id: 'google-user-id',
      email: googlePayload.email,
      name: googlePayload.name,
      password: null,
      googleId: googlePayload.sub,
      emailVerifiedAt: new Date(),
    } as any);
    p.user.update.mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-token', acceptedTerms: true });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).not.toHaveProperty('password');
    expect(p.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: null,
          googleId: googlePayload.sub,
          emailVerifiedAt: expect.any(Date),
        }),
      })
    );
  });

  it('links Google identity to an existing account with the same email', async () => {
    mockValidTicket({ ...googlePayload, email: TEST_USER_EMAIL });
    // Primer lookup (googleId) falla, segundo (email) encuentra la cuenta clásica.
    p.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUserBase as any);
    p.user.update.mockResolvedValue({
      ...mockUserBase,
      googleId: googlePayload.sub,
      emailVerifiedAt: new Date(),
    } as any);

    const res = await request(app).post('/api/auth/google').send({ idToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(p.user.create).not.toHaveBeenCalled();
    expect(p.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ googleId: googlePayload.sub }),
      })
    );
  });

  it('returns 401 when the id_token is invalid', async () => {
    verifyIdTokenMock.mockRejectedValue(new Error('invalid signature'));

    const res = await request(app).post('/api/auth/google').send({ idToken: 'bad-token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when Google reports the email as unverified', async () => {
    mockValidTicket({ ...googlePayload, email_verified: false });

    const res = await request(app).post('/api/auth/google').send({ idToken: 'valid-token' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when idToken is missing', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  it('returns 201 with tokens on successful registration', async () => {
    p.user.findUnique.mockResolvedValue(null);
    p.user.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'new@horus.app',
      name: 'New User',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    p.user.update.mockResolvedValue({} as any);

    const res = await request(app).post('/api/auth/register').send({
      email: 'new@horus.app',
      name: 'New User',
      password: 'Secure123!',
      acceptedTerms: true,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('returns 400 when terms are not accepted', async () => {
    p.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new2@horus.app', name: 'New User', password: 'Secure123!' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when email is already taken', async () => {
    p.user.findUnique.mockResolvedValue(mockUserBase as any);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_USER_EMAIL, name: 'User', password: 'pass123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns 200 with new tokens on valid refresh token', async () => {
    const refreshToken = createTestRefreshToken();
    // En DB se guarda el hash, no el token en claro.
    p.user.findUnique.mockResolvedValue({
      ...mockUserBase,
      refreshToken: authService.hashRefreshToken(refreshToken),
    } as any);
    p.user.update.mockResolvedValue({} as any);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('returns 401 on invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid.token' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when a validly-signed token does not match the stored hash', async () => {
    const refreshToken = createTestRefreshToken();
    // Firma válida pero el hash guardado corresponde a otro token (rotado/robado).
    p.user.findUnique.mockResolvedValue({
      ...mockUserBase,
      refreshToken: authService.hashRefreshToken('some-other-token'),
    } as any);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the session was revoked (stored hash is null)', async () => {
    const refreshToken = createTestRefreshToken();
    p.user.findUnique.mockResolvedValue({ ...mockUserBase, refreshToken: null } as any);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 200 and clears refresh token', async () => {
    p.user.update.mockResolvedValue({ ...mockUserBase, refreshToken: null } as any);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${createTestToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 200 with current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${createTestToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
  });
});

describe('PATCH /api/auth/me', () => {
  it('maps onboardingCompleted to an onboardingCompletedAt timestamp', async () => {
    p.user.update.mockResolvedValue({
      ...mockUserBase,
      onboardingCompletedAt: new Date(),
    } as any);

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ onboardingCompleted: true });

    expect(res.status).toBe(200);
    expect(p.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ onboardingCompletedAt: expect.any(Date) }),
      })
    );
  });

  it('rejects onboardingCompleted: false', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ onboardingCompleted: false });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/export', () => {
  it('returns 200 with a JSON attachment', async () => {
    const res = await request(app)
      .get('/api/auth/export')
      .set('Authorization', `Bearer ${createTestToken()}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.body).toHaveProperty('exportedAt');
  });
});

describe('DELETE /api/auth/me', () => {
  it('returns 401 when the confirmation password is wrong', async () => {
    p.user.findUnique.mockResolvedValue(mockUserBase as any);

    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when no password is provided', async () => {
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 200 and deletes the account with the correct password', async () => {
    p.user.findUnique.mockResolvedValue(mockUserBase as any);

    const res = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${createTestToken()}`)
      .send({ password: 'password123' });

    expect(res.status).toBe(200);
  });
});
