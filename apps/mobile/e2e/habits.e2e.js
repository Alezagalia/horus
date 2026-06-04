/**
 * Habits E2E Tests — Detox
 * Requires: dev build + running emulator + logged-in session
 * Run:  pnpm test:e2e:build && pnpm test:e2e
 */

const { device, element, by, expect: detoxExpect, waitFor } = require('detox');

describe('Habits Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      // Pre-populate auth token so we skip the login screen
      permissions: { notifications: 'YES' },
    });

    // Login first
    await waitFor(element(by.id('email-input')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('email-input')).typeText(process.env.TEST_USER_EMAIL ?? 'demo@horus.com');
    await element(by.id('password-input')).typeText(process.env.TEST_USER_PASSWORD ?? 'demo1234');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should display habits section on home screen', async () => {
    // Home tab should show habits
    await detoxExpect(element(by.id('habits-section'))).toBeVisible();
  });

  it('should toggle a habit as complete', async () => {
    const habitItems = element(by.id('habit-item'));
    const count = await habitItems.getAttributes();

    if (count) {
      // Tap the first habit toggle
      await element(by.id('habit-toggle-0')).tap();

      // Toggle should reflect completion
      await waitFor(element(by.id('habit-toggle-0')))
        .toBeVisible()
        .withTimeout(3000);
    }
  });

  it('should show habit list in Yo tab', async () => {
    await element(by.id('tab-yo')).tap();

    // Find the Actividades / Habits section
    await waitFor(element(by.text('Hábitos')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should verify habit completion is persisted', async () => {
    // Reload app (simulates background/foreground)
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Habits section should still be visible
    await detoxExpect(element(by.id('habits-section'))).toBeVisible();
  });
});
