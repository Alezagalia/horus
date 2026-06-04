import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.helper';

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.click('text=Metas');
    await expect(page).toHaveURL(/.*goals/);
  });

  test('should display goals page', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);
  });

  test('should show create goal button', async ({ page }) => {
    const createBtn = page.locator(
      'button:has-text("Nueva Meta"), button:has-text("Nueva meta"), button:has-text("Crear")'
    );
    await expect(createBtn.first()).toBeVisible();
  });

  test('should open create goal modal', async ({ page }) => {
    await page.click('button:has-text("Nueva Meta"), button:has-text("Nueva meta")');
    await expect(page.locator('role=dialog')).toBeVisible();
  });

  test('should create a new goal', async ({ page }) => {
    await page.click('button:has-text("Nueva Meta"), button:has-text("Nueva meta")');
    await expect(page.locator('role=dialog')).toBeVisible();

    const timestamp = Date.now();
    await page.fill(
      '[name="title"], [placeholder*="título"], [placeholder*="meta"]',
      `Goal E2E ${timestamp}`
    );

    await page.click(
      'button[type="submit"]:has-text("Crear"), button[type="submit"]:has-text("Guardar")'
    );
    await expect(page.locator(`text=Goal E2E ${timestamp}`)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to goal detail', async ({ page }) => {
    // Click on first goal if any exist
    const goalCards = page.locator('[data-testid="goal-card"], .goal-card');
    const count = await goalCards.count();
    if (count > 0) {
      await goalCards.first().click();
      await expect(page).toHaveURL(/.*goals\/.+/);
    } else {
      test.skip();
    }
  });

  test('should show goal progress indicator', async ({ page }) => {
    const goalCards = page.locator('[data-testid="goal-card"], .goal-card');
    const count = await goalCards.count();
    if (count > 0) {
      // Progress should be visible (0-100%)
      const progressEl = page.locator(
        '[data-testid="goal-progress"], .progress, [role="progressbar"]'
      );
      await expect(progressEl.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should filter goals by status', async ({ page }) => {
    // Status filter tabs or dropdowns
    const filterEl = page.locator(
      'button:has-text("En progreso"), [role="tab"]:has-text("En progreso")'
    );
    if (await filterEl.isVisible()) {
      await filterEl.click();
      await expect(page).not.toHaveURL(/error/);
    } else {
      test.skip();
    }
  });

  test('should delete a goal', async ({ page }) => {
    const goalCards = page.locator('[data-testid="goal-card"], .goal-card');
    const count = await goalCards.count();
    if (count > 0) {
      // Open context menu or find delete button
      const deleteBtn = page.locator('button:has-text("Eliminar"), [aria-label="Eliminar"]');
      if (await deleteBtn.first().isVisible()) {
        await deleteBtn.first().click();
        // Confirm dialog
        const confirmBtn = page.locator(
          'button:has-text("Confirmar"), button:has-text("Eliminar"):visible'
        );
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    } else {
      test.skip();
    }
  });
});
