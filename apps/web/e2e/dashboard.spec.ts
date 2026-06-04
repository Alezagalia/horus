import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth.helper';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page).toHaveTitle(/Horus/i);
  });

  test('should show main content sections', async ({ page }) => {
    // Dashboard should have a main container with content
    await expect(page.locator('main, [data-testid="dashboard"], #dashboard')).toBeVisible();
  });

  test('should display navigation sidebar', async ({ page }) => {
    // Sidebar with navigation links should be visible
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should navigate to Habits from sidebar link', async ({ page }) => {
    await page.click('text=Hábitos');
    await expect(page).toHaveURL(/.*habits/);
  });

  test('should navigate to Tasks from sidebar link', async ({ page }) => {
    await page.click('text=Tareas');
    await expect(page).toHaveURL(/.*tasks/);
  });
});
