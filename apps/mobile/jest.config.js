/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo/android',
  // Required: transform Expo/RN packages that ship as ESM
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-router|@horus/shared)',
  ],
  setupFiles: ['<rootDir>/jest.setup.env.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    // Offline-first: la DB local (SQLite/JSI) no existe en Jest → mocks
    '^@/db$': '<rootDir>/jest.mocks/db.js',
    '^@/db/syncScheduler$': '<rootDir>/jest.mocks/syncScheduler.js',
    '^@/db/moneyQueries$': '<rootDir>/jest.mocks/moneyQueries.js',
    '^@/db/moneyWrites$': '<rootDir>/jest.mocks/moneyWrites.js',
    '^@/db/habitQueries$': '<rootDir>/jest.mocks/habitQueries.js',
    '^@/db/habitWrites$': '<rootDir>/jest.mocks/habitWrites.js',
    '^@/db/taskQueries$': '<rootDir>/jest.mocks/taskQueries.js',
    '^@/db/taskWrites$': '<rootDir>/jest.mocks/taskWrites.js',
    '^@/db/goalQueries$': '<rootDir>/jest.mocks/goalQueries.js',
    '^@/db/goalWrites$': '<rootDir>/jest.mocks/goalWrites.js',
    '^@/db/eventQueries$': '<rootDir>/jest.mocks/eventQueries.js',
    '^@/db/eventWrites$': '<rootDir>/jest.mocks/eventWrites.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@horus/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/app/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/plugins/**/__tests__/**/*.test.{js,ts}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
};
