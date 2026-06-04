import jwt from 'jsonwebtoken';

export const TEST_USER_ID = 'test-user-id';
export const TEST_USER_EMAIL = 'test@horus.app';

export function createTestToken(
  userId = TEST_USER_ID,
  email = TEST_USER_EMAIL,
  secret = process.env.JWT_SECRET ?? 'test-secret-key-for-vitest'
): string {
  return jwt.sign({ userId, email }, secret, { expiresIn: '1h' });
}

export function createTestRefreshToken(userId = TEST_USER_ID, email = TEST_USER_EMAIL): string {
  const secret = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
  return jwt.sign({ userId, email }, secret, { expiresIn: '7d' });
}
