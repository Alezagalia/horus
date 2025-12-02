/**
 * E2E Tests - Authentication Flow
 * Sprint 12 - US-111: Tests E2E en Mobile con Detox
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Wait for the app to load
      await detoxExpect(element(by.id('auth-container'))).toBeVisible();

      // Navigate to register screen
      await element(by.id('register-link')).tap();
      await detoxExpect(element(by.id('register-screen'))).toBeVisible();

      // Fill registration form
      const timestamp = Date.now();
      await element(by.id('register-name-input')).typeText(`Test User ${timestamp}`);
      await element(by.id('register-email-input')).typeText(`test${timestamp}@horus.com`);
      await element(by.id('register-password-input')).typeText('Test1234!');
      await element(by.id('register-confirm-password-input')).typeText('Test1234!');

      // Submit registration
      await element(by.id('register-submit-button')).tap();

      // Should navigate to main app
      await detoxExpect(element(by.id('main-tabs'))).toBeVisible();
    });

    it('should show validation errors for invalid inputs', async () => {
      await detoxExpect(element(by.id('auth-container'))).toBeVisible();
      await element(by.id('register-link')).tap();

      // Try to submit empty form
      await element(by.id('register-submit-button')).tap();

      // Should show validation errors
      await detoxExpect(element(by.text(/nombre es requerido/i))).toBeVisible();
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      await detoxExpect(element(by.id('auth-container'))).toBeVisible();

      // Fill login form (using demo credentials)
      await element(by.id('login-email-input')).typeText('demo@horus.com');
      await element(by.id('login-password-input')).typeText('demo1234');

      // Submit login
      await element(by.id('login-submit-button')).tap();

      // Should navigate to main app
      await detoxExpect(element(by.id('main-tabs'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await detoxExpect(element(by.id('auth-container'))).toBeVisible();

      // Fill login form with invalid credentials
      await element(by.id('login-email-input')).typeText('invalid@test.com');
      await element(by.id('login-password-input')).typeText('wrongpass');

      // Submit login
      await element(by.id('login-submit-button')).tap();

      // Should show error message
      await detoxExpect(element(by.text(/credenciales inválidas/i))).toBeVisible();
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      // First login
      await detoxExpect(element(by.id('auth-container'))).toBeVisible();
      await element(by.id('login-email-input')).typeText('demo@horus.com');
      await element(by.id('login-password-input')).typeText('demo1234');
      await element(by.id('login-submit-button')).tap();
      await detoxExpect(element(by.id('main-tabs'))).toBeVisible();

      // Navigate to profile
      await element(by.id('tab-profile')).tap();
      await detoxExpect(element(by.id('profile-screen'))).toBeVisible();

      // Logout
      await element(by.id('logout-button')).tap();

      // Should return to auth screen
      await detoxExpect(element(by.id('auth-container'))).toBeVisible();
    });
  });
});
