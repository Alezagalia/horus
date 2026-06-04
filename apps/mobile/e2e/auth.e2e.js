/**
 * Auth E2E Tests — Detox
 * Requires: dev build (expo run:android) + running emulator (Pixel_6_API_34)
 * Run:  pnpm test:e2e:build && pnpm test:e2e
 */

const { device, element, by, expect: detoxExpect, waitFor } = require('detox');

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Login', () => {
    it('should display login form', async () => {
      await detoxExpect(element(by.id('email-input'))).toBeVisible();
      await detoxExpect(element(by.id('password-input'))).toBeVisible();
      await detoxExpect(element(by.id('login-button'))).toBeVisible();
    });

    it('should show error on invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@email.com');
      await element(by.id('password-input')).typeText('wrongpass');
      await element(by.id('login-button')).tap();

      await waitFor(element(by.text('Credenciales inválidas')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate to main app on valid credentials', async () => {
      // Clear fields first
      await element(by.id('email-input')).clearText();
      await element(by.id('password-input')).clearText();

      await element(by.id('email-input')).typeText(process.env.TEST_USER_EMAIL ?? 'demo@horus.com');
      await element(by.id('password-input')).typeText(process.env.TEST_USER_PASSWORD ?? 'demo1234');
      await element(by.id('login-button')).tap();

      // Should navigate away from login screen
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Logout', () => {
    it('should logout and return to login screen', async () => {
      // Navigate to profile/settings to find logout
      await element(by.id('tab-yo')).tap();
      await element(by.id('logout-button')).tap();

      // Should be back on login screen
      await waitFor(element(by.id('email-input')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
