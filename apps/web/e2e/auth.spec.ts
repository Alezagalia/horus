/**
 * E2E Tests - Authentication Flow
 * Sprint 12 - US-112: Tests E2E en Web con Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to register page
      await page.click('text=Registrarse');
      await expect(page).toHaveURL(/.*register/);

      // Fill registration form
      const timestamp = Date.now();
      await page.fill('[name="name"]', `Test User ${timestamp}`);
      await page.fill('[name="email"]', `test${timestamp}@horus.com`);
      await page.fill('[name="password"]', 'Test1234!');
      await page.fill('[name="confirmPassword"]', 'Test1234!');

      // Submit form
      await page.click('button[type="submit"]');

      // Should navigate to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('text=Hábitos')).toBeVisible();
    });

    test('should show validation errors for invalid inputs', async ({ page }) => {
      await page.click('text=Registrarse');
      await expect(page).toHaveURL(/.*register/);

      // Submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=/nombre.*requerido/i')).toBeVisible();
      await expect(page.locator('text=/email.*requerido/i')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.click('text=Registrarse');

      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'test@test.com');
      await page.fill('[name="password"]', '123'); // Weak password
      await page.fill('[name="confirmPassword"]', '123');

      await page.click('button[type="submit"]');

      // Should show password strength error
      await expect(page.locator('text=/contraseña.*débil/i')).toBeVisible();
    });

    test('should validate password confirmation match', async ({ page }) => {
      await page.click('text=Registrarse');

      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'test@test.com');
      await page.fill('[name="password"]', 'Test1234!');
      await page.fill('[name="confirmPassword"]', 'DifferentPass123!');

      await page.click('button[type="submit"]');

      // Should show mismatch error
      await expect(page.locator('text=/contraseñas.*coinciden/i')).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Fill login form with demo credentials
      await page.fill('[name="email"]', 'demo@horus.com');
      await page.fill('[name="password"]', 'demo1234');

      // Submit login
      await page.click('button[type="submit"]');

      // Should navigate to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('text=Hábitos')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('[name="email"]', 'invalid@test.com');
      await page.fill('[name="password"]', 'wrongpassword');

      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=/credenciales.*inválidas/i')).toBeVisible();
      await expect(page).toHaveURL(/.*login/);
    });

    test('should validate required fields', async ({ page }) => {
      // Submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=/email.*requerido/i')).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.fill('[name="password"]', 'test123');

      // Password should be hidden by default
      const passwordInput = page.locator('[name="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle visibility button
      await page.click('[aria-label="Mostrar contraseña"]');

      // Password should be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await page.fill('[name="email"]', 'demo@horus.com');
      await page.fill('[name="password"]', 'demo1234');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*dashboard/);

      // Open user menu
      await page.click('[aria-label="Menú de usuario"]');

      // Click logout
      await page.click('text=Cerrar sesión');

      // Should redirect to login page
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('[name="email"]')).toBeVisible();
    });
  });

  test.describe('Remember Me', () => {
    test('should remember user session', async ({ page, context }) => {
      await page.fill('[name="email"]', 'demo@horus.com');
      await page.fill('[name="password"]', 'demo1234');

      // Check "Remember me" checkbox
      await page.check('[name="rememberMe"]');

      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);

      // Close page and create new one (simulating browser restart)
      await page.close();
      const newPage = await context.newPage();
      await newPage.goto('/');

      // Should still be logged in
      await expect(newPage).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('Password Reset', () => {
    test('should navigate to password reset page', async ({ page }) => {
      await page.click('text=¿Olvidaste tu contraseña?');

      await expect(page).toHaveURL(/.*forgot-password/);
      await expect(page.locator('h1:has-text("Recuperar contraseña")')).toBeVisible();
    });

    test('should send password reset email', async ({ page }) => {
      await page.click('text=¿Olvidaste tu contraseña?');

      await page.fill('[name="email"]', 'demo@horus.com');
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=/email enviado/i')).toBeVisible();
    });
  });
});
