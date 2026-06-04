import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-key-for-vitest',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRES_IN: '7d',
      NODE_ENV: 'test',
      // 64-char hex string required by env.ts ENCRYPTION_KEY validation
      ENCRYPTION_KEY: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/generated/**', 'src/test/**'],
      thresholds: { lines: 40, functions: 40 },
    },
  },
});
