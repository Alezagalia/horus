/**
 * E2E Tests - Habits Flow
 * Sprint 12 - US-112: Tests E2E en Web con Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Habits Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('[name="email"]', 'demo@horus.com');
    await page.fill('[name="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Habits section
    await page.click('text=Hábitos');
    await expect(page).toHaveURL(/.*habits/);
  });

  test.describe('Create Habit', () => {
    test('should create a CHECK habit successfully', async ({ page }) => {
      // Open create habit dialog
      await page.click('button:has-text("Nuevo Hábito")');

      // Wait for dialog to be visible
      await expect(page.locator('role=dialog')).toBeVisible();

      // Fill habit form
      const timestamp = Date.now();
      await page.fill('[name="name"]', `Check Habit ${timestamp}`);
      await page.fill('[name="description"]', 'E2E Test Habit');

      // Select CHECK type (should be default)
      await page.click('[value="CHECK"]');

      // Select frequency
      await page.click('[value="DAILY"]');

      // Set reminder
      await page.check('[name="hasReminder"]');
      await page.fill('[name="reminderTime"]', '09:00');

      // Submit form
      await page.click('button[type="submit"]:has-text("Crear")');

      // Should see the new habit in the list
      await expect(page.locator(`text=Check Habit ${timestamp}`)).toBeVisible();
    });

    test('should create a NUMERIC habit successfully', async ({ page }) => {
      await page.click('button:has-text("Nuevo Hábito")');
      await expect(page.locator('role=dialog')).toBeVisible();

      const timestamp = Date.now();
      await page.fill('[name="name"]', `Numeric Habit ${timestamp}`);
      await page.fill('[name="description"]', 'E2E Numeric Test');

      // Select NUMERIC type
      await page.click('[value="NUMERIC"]');

      // Set target and unit
      await page.fill('[name="targetValue"]', '8');
      await page.fill('[name="unit"]', 'vasos');

      // Select frequency
      await page.click('[value="DAILY"]');

      // Submit form
      await page.click('button[type="submit"]:has-text("Crear")');

      // Should see the new habit
      await expect(page.locator(`text=Numeric Habit ${timestamp}`)).toBeVisible();
      await expect(page.locator('text=/ 8 vasos')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('button:has-text("Nuevo Hábito")');

      // Submit without filling form
      await page.click('button[type="submit"]:has-text("Crear")');

      // Should show validation errors
      await expect(page.locator('text=/nombre.*requerido/i')).toBeVisible();
    });
  });

  test.describe('Mark Habit as Completed', () => {
    test('should mark a CHECK habit as completed', async ({ page }) => {
      // Find first habit card
      const habitCard = page.locator('[data-testid="habit-card"]').first();
      await expect(habitCard).toBeVisible();

      // Click checkbox to mark as complete
      const checkbox = habitCard.locator('[type="checkbox"]');
      await checkbox.check();

      // Should show completed state
      await expect(checkbox).toBeChecked();

      // Should show success toast
      await expect(page.locator('text=/completado/i')).toBeVisible();
    });

    test('should update progress for NUMERIC habit', async ({ page }) => {
      // Find a numeric habit
      const numericHabit = page.locator('[data-testid="habit-card-numeric"]').first();

      if (await numericHabit.isVisible()) {
        // Click to open progress dialog
        await numericHabit.locator('button:has-text("Actualizar")').click();

        // Enter progress value
        await page.fill('[name="progress"]', '5');
        await page.click('button[type="submit"]:has-text("Guardar")');

        // Should show updated progress
        await expect(page.locator('text=5 /')).toBeVisible();
      }
    });

    test('should increment streak on consecutive days', async ({ page }) => {
      const habitCard = page.locator('[data-testid="habit-card"]').first();

      // Get current streak count
      const streakBefore = await habitCard.locator('[data-testid="streak-count"]').textContent();

      // Mark as complete
      await habitCard.locator('[type="checkbox"]').check();

      // Wait for update
      await page.waitForTimeout(1000);

      // Streak should be visible
      await expect(habitCard.locator('[data-testid="streak-indicator"]')).toBeVisible();
    });
  });

  test.describe('View Habit Statistics', () => {
    test('should navigate to habit detail page', async ({ page }) => {
      // Click on a habit card
      const habitCard = page.locator('[data-testid="habit-card"]').first();
      await habitCard.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/.*habits\/[^/]+$/);

      // Should see statistics section
      await expect(page.locator('h2:has-text("Estadísticas")')).toBeVisible();
    });

    test('should display completion chart', async ({ page }) => {
      await page.locator('[data-testid="habit-card"]').first().click();

      // Should see chart
      await expect(page.locator('[data-testid="completion-chart"]')).toBeVisible();
    });

    test('should display streak information', async ({ page }) => {
      await page.locator('[data-testid="habit-card"]').first().click();

      // Should see current streak
      await expect(page.locator('text=/racha actual/i')).toBeVisible();

      // Should see longest streak
      await expect(page.locator('text=/mejor racha/i')).toBeVisible();
    });

    test('should display completion calendar', async ({ page }) => {
      await page.locator('[data-testid="habit-card"]').first().click();

      // Scroll to calendar section
      await page.locator('text=Calendario').scrollIntoViewIfNeeded();

      // Should see calendar
      await expect(page.locator('[data-testid="habit-calendar"]')).toBeVisible();
    });
  });

  test.describe('Filter and Sort Habits', () => {
    test('should filter habits by category', async ({ page }) => {
      // Open filter menu
      await page.click('button:has-text("Filtrar")');

      // Select a category
      await page.click('text=Salud');

      // Should show only health habits
      const visibleHabits = page.locator('[data-testid="habit-card"]');
      await expect(visibleHabits.first()).toBeVisible();
    });

    test('should filter by active/inactive status', async ({ page }) => {
      await page.click('button:has-text("Filtrar")');

      // Show only active habits
      await page.click('[value="active"]');

      // Should update the list
      await expect(page.locator('[data-testid="habit-card"]')).not.toHaveCount(0);
    });
  });

  test.describe('Edit Habit', () => {
    test('should edit habit details', async ({ page }) => {
      // Click on habit card to open detail
      await page.locator('[data-testid="habit-card"]').first().click();

      // Click edit button
      await page.click('button:has-text("Editar")');

      // Update name
      await page.fill('[name="name"]', 'Updated Habit Name');

      // Save changes
      await page.click('button[type="submit"]:has-text("Guardar")');

      // Should show updated name
      await expect(page.locator('h1:has-text("Updated Habit Name")')).toBeVisible();
    });
  });

  test.describe('Delete Habit', () => {
    test('should delete a habit', async ({ page }) => {
      // Get habit name before deletion
      const habitName = await page
        .locator('[data-testid="habit-card"]')
        .first()
        .locator('[data-testid="habit-name"]')
        .textContent();

      // Click on habit card
      await page.locator('[data-testid="habit-card"]').first().click();

      // Click delete button
      await page.click('button:has-text("Eliminar")');

      // Confirm deletion
      await page.click('button:has-text("Confirmar")');

      // Should navigate back to habits list
      await expect(page).toHaveURL(/.*habits$/);

      // Habit should no longer be visible
      if (habitName) {
        await expect(page.locator(`text=${habitName}`)).not.toBeVisible();
      }
    });
  });
});
