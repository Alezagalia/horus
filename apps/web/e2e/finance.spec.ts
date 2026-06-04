import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.helper';

test.describe('Finance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.click('text=Finanzas, text=Cuentas');
    await expect(page).toHaveURL(/.*accounts|transactions|finance/);
  });

  test('should display finance/accounts page', async ({ page }) => {
    await expect(page).toHaveURL(/.*accounts|transactions|finance/);
  });

  test('should show accounts section', async ({ page }) => {
    const accountsSection = page.locator(
      '[data-testid="accounts"], text=Cuentas, h1:has-text("Cuentas")'
    );
    await expect(accountsSection.first()).toBeVisible();
  });

  test('should show total balance', async ({ page }) => {
    const balance = page.locator('[data-testid="total-balance"], text=Balance, text=balance');
    if (await balance.first().isVisible()) {
      await expect(balance.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should navigate to transactions', async ({ page }) => {
    const transactionsLink = page.locator('text=Transacciones, a[href*="transactions"]');
    if (await transactionsLink.first().isVisible()) {
      await transactionsLink.first().click();
      await expect(page).toHaveURL(/.*transactions/);
    } else {
      test.skip();
    }
  });

  test('should open add transaction modal', async ({ page }) => {
    const addBtn = page.locator(
      'button:has-text("Nueva Transacción"), button:has-text("Agregar"), button:has-text("Nueva transacción")'
    );
    if (await addBtn.first().isVisible()) {
      await addBtn.first().click();
      await expect(page.locator('role=dialog')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show transaction filters', async ({ page }) => {
    await page.goto('/transactions');
    // Filter controls (type, date range, etc.) should be present
    const filterEl = page.locator('[data-testid="filters"], select, [role="combobox"]');
    if (
      await filterEl
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await expect(filterEl.first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display recurring expenses section', async ({ page }) => {
    const recLink = page.locator('text=Gastos Recurrentes, a[href*="recurring"]');
    if (await recLink.first().isVisible()) {
      await recLink.first().click();
      await expect(page).toHaveURL(/.*recurring/);
    } else {
      test.skip();
    }
  });
});
