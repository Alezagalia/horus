import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.helper';

test.describe('Routines', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/routines');
    await expect(page).toHaveURL(/.*routines/);
  });

  test('should display routines list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*routines/);
    await expect(page.locator('main, [data-testid="routines"]')).toBeVisible();
  });

  test('should show create routine button', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nueva Rutina"), button:has-text("Crear rutina"), button:has-text("Nueva rutina")'
    );
    await expect(createBtn.first()).toBeVisible();
  });

  test('should open create routine modal or form', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nueva Rutina"), button:has-text("Crear rutina"), button:has-text("Nueva rutina")'
    );
    await createBtn.first().click();

    // Either a dialog or a new page/form should appear
    const dialog = page.locator('role=dialog');
    const form = page.locator('form');
    const visible =
      (await dialog.isVisible().catch(() => false)) || (await form.isVisible().catch(() => false));
    expect(visible).toBe(true);
  });

  test('should navigate to routine detail when clicking a routine', async ({ page }) => {
    const routineCards = page.locator('[data-testid="routine-card"], .routine-card');
    const count = await routineCards.count();
    if (count > 0) {
      await routineCards.first().click();
      await expect(page).toHaveURL(/.*routines\/.+/);
    } else {
      test.skip();
    }
  });

  test('should navigate to exercises page', async ({ page }) => {
    const exercisesLink = page.locator('text=Ejercicios, a[href*="exercises"]');
    if (await exercisesLink.first().isVisible()) {
      await exercisesLink.first().click();
      await expect(page).toHaveURL(/.*exercises/);
    } else {
      test.skip();
    }
  });
});
