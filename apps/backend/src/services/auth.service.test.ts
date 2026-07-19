import { describe, it, expect, beforeEach, vi } from 'vitest';

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

vi.mock('./category.service.js', () => ({
  categoryService: { createDefaultCategories: vi.fn().mockResolvedValue([]) },
}));

vi.mock('./habitMoment.service.js', () => ({
  habitMomentService: { createDefaultMoments: vi.fn().mockResolvedValue([]) },
}));

import { prisma } from '../lib/prisma.js';
import { authService } from './auth.service.js';

const p = vi.mocked(prisma, true);

const USER_ID = 'user-1';
const USER_EMAIL = 'test@horus.app';

const mockUser = {
  id: USER_ID,
  email: USER_EMAIL,
  name: 'Test User',
  password: '',
  refreshToken: null,
  hourlyRate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.hashPassword / comparePassword', () => {
  it('hashes and verifies a password', async () => {
    const hashed = await authService.hashPassword('secret123');
    expect(hashed).not.toBe('secret123');

    expect(await authService.comparePassword('secret123', hashed)).toBe(true);
    expect(await authService.comparePassword('wrong', hashed)).toBe(false);
  });
});

describe('authService.generateTokens / verifyAccessToken', () => {
  it('generates tokens and verifies access token', () => {
    const tokens = authService.generateTokens({ userId: USER_ID, email: USER_EMAIL });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const payload = authService.verifyAccessToken(tokens.accessToken);
    expect(payload.userId).toBe(USER_ID);
    expect(payload.email).toBe(USER_EMAIL);
  });

  it('throws on invalid access token', () => {
    expect(() => authService.verifyAccessToken('invalid.token.here')).toThrow();
  });
});

describe('authService.verifyRefreshToken', () => {
  it('verifies a valid refresh token', () => {
    const tokens = authService.generateTokens({ userId: USER_ID, email: USER_EMAIL });
    const payload = authService.verifyRefreshToken(tokens.refreshToken);
    expect(payload.userId).toBe(USER_ID);
  });

  it('throws on tampered refresh token', () => {
    expect(() => authService.verifyRefreshToken('bad.refresh.token')).toThrow();
  });
});

describe('authService.findUserByEmail', () => {
  it('returns user when found', async () => {
    p.user.findUnique.mockResolvedValue(mockUser as any);

    const result = await authService.findUserByEmail(USER_EMAIL);

    expect(result).toEqual(mockUser);
    expect(p.user.findUnique).toHaveBeenCalledWith({ where: { email: USER_EMAIL } });
  });

  it('returns null when not found', async () => {
    p.user.findUnique.mockResolvedValue(null);
    const result = await authService.findUserByEmail('nobody@test.com');
    expect(result).toBeNull();
  });
});

describe('authService.createUser', () => {
  it('creates user with hashed password and returns without password', async () => {
    const createdUser = {
      id: USER_ID,
      email: USER_EMAIL,
      name: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    p.user.create.mockResolvedValue(createdUser as any);

    const result = await authService.createUser({
      email: USER_EMAIL,
      name: 'Test',
      password: 'plain123',
    });

    expect(result.id).toBe(USER_ID);
    expect(result).not.toHaveProperty('password');
    expect(p.user.create).toHaveBeenCalled();
  });
});

describe('authService.updateRefreshToken', () => {
  it('stores the SHA-256 hash of the token, not the token itself', async () => {
    p.user.update.mockResolvedValue({ ...mockUser } as any);

    await authService.updateRefreshToken(USER_ID, 'new-token');

    expect(p.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: { refreshToken: authService.hashRefreshToken('new-token') },
      })
    );
    // Nunca el token en claro.
    const stored = (p.user.update.mock.calls[0][0] as any).data.refreshToken;
    expect(stored).not.toBe('new-token');
  });

  it('stores null when revoking (logout)', async () => {
    p.user.update.mockResolvedValue({ ...mockUser, refreshToken: null } as any);

    await authService.updateRefreshToken(USER_ID, null);

    expect(p.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: USER_ID }, data: { refreshToken: null } })
    );
  });
});

describe('authService.refreshTokenMatches', () => {
  it('acepta el token correcto contra su hash', () => {
    const hash = authService.hashRefreshToken('the-token');
    expect(authService.refreshTokenMatches('the-token', hash)).toBe(true);
  });

  it('rechaza un token distinto', () => {
    const hash = authService.hashRefreshToken('the-token');
    expect(authService.refreshTokenMatches('otro-token', hash)).toBe(false);
  });

  it('rechaza cuando el hash guardado es null (sesión revocada)', () => {
    expect(authService.refreshTokenMatches('the-token', null)).toBe(false);
  });
});

describe('authService.excludePassword', () => {
  it('removes password field', () => {
    const user = { id: '1', email: 'a@b.com', name: 'X', password: 'hashed' };
    const result = authService.excludePassword(user);
    expect(result).not.toHaveProperty('password');
    expect(result.email).toBe('a@b.com');
  });
});
