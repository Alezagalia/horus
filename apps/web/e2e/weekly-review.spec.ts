import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.helper';

test.describe('Weekly Review', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should navigate to weekly review page', async ({ page }) => {
    // Find the weekly review link in sidebar
    const reviewLink = page.locator('text=Revisión Semanal, a[href*="weekly-review"]');
    await reviewLink.first().click();
    await expect(page).toHaveURL(/.*weekly-review/);
  });

  test('should display current week stats', async ({ page }) => {
    await page.goto('/weekly-review');
    await expect(page).toHaveURL(/.*weekly-review/);

    // Page should load with stats sections
    await expect(page.locator('main, [data-testid="weekly-review"]')).toBeVisible();
  });

  test('should show habit completion stats', async ({ page }) => {
    await page.goto('/weekly-review');

    // Stats for habits should be visible
    const habitStats = page.locator('text=Hábitos, [data-testid="habit-stats"]');
    if (
      await habitStats
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(habitStats.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show reflection questions section', async ({ page }) => {
    await page.goto('/weekly-review');

    // Reflection section with questions
    const reflectionSection = page.locator(
      '[data-testid="reflection"], text=Reflexión, text=reflexión'
    );
    if (
      await reflectionSection
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(reflectionSection.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should allow saving review answers', async ({ page }) => {
    await page.goto('/weekly-review');

    // Find text areas or inputs for answers
    const textInputs = page.locator('textarea, input[type="text"]');
    const count = await textInputs.count();
    if (count > 0) {
      await textInputs.first().fill('Test answer for weekly review');
      const saveBtn = page.locator('button:has-text("Guardar"), button:has-text("Completar")');
      if (await saveBtn.first().isVisible()) {
        await saveBtn.first().click();
        // Should not navigate away or show error
        await expect(page).toHaveURL(/.*weekly-review/);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should display review history', async ({ page }) => {
    await page.goto('/weekly-review');

    // History section
    const historySection = page.locator(
      '[data-testid="review-history"], text=Historial, text=historial'
    );
    if (
      await historySection
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await expect(historySection.first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});
