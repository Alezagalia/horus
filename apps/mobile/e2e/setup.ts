/**
 * Detox E2E Test Setup
 * Sprint 12 - US-111: Tests E2E en Mobile con Detox
 */

import { device } from 'detox';

beforeAll(async () => {
  await device.launchApp({
    permissions: { notifications: 'YES' },
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await device.terminateApp();
});
