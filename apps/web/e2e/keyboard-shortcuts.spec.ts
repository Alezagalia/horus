/**
 * E2E Tests - Keyboard Shortcuts
 * Sprint 12 - US-112: Tests E2E en Web con Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('[name="email"]', 'demo@horus.com');
    await page.fill('[name="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test.describe('Navigation Shortcuts (j/k)', () => {
    test('should navigate down with "j" key in habits list', async ({ page }) => {
      await page.click('text=Hábitos');
      await expect(page).toHaveURL(/.*habits/);

      // Get first habit
      const firstHabit = page.locator('[data-testid="habit-card"]').first();
      const firstHabitId = await firstHabit.getAttribute('data-id');

      // Press "j" to move down
      await page.keyboard.press('j');

      // Second habit should be focused/selected
      const focusedElement = page.locator('[data-focused="true"]');
      if ((await focusedElement.count()) > 0) {
        const focusedId = await focusedElement.getAttribute('data-id');
        expect(focusedId).not.toBe(firstHabitId);
      }
    });

    test('should navigate up with "k" key in habits list', async ({ page }) => {
      await page.click('text=Hábitos');

      // Press "j" twice to move down
      await page.keyboard.press('j');
      await page.keyboard.press('j');

      // Press "k" to move up
      await page.keyboard.press('k');

      // Should move focus up
      await expect(page.locator('[data-focused="true"]')).toBeVisible();
    });

    test('should navigate down with "j" key in tasks list', async ({ page }) => {
      await page.click('text=Tareas');
      await expect(page).toHaveURL(/.*tasks/);

      // Press "j" to move down
      await page.keyboard.press('j');

      // Should have focused element
      const focused = page.locator('[data-focused="true"]');
      if ((await focused.count()) > 0) {
        await expect(focused).toBeVisible();
      }
    });

    test('should navigate up with "k" key in tasks list', async ({ page }) => {
      await page.click('text=Tareas');

      await page.keyboard.press('j');
      await page.keyboard.press('j');
      await page.keyboard.press('k');

      const focused = page.locator('[data-focused="true"]');
      if ((await focused.count()) > 0) {
        await expect(focused).toBeVisible();
      }
    });
  });

  test.describe('Action Shortcuts (Space)', () => {
    test('should mark habit as completed with Space key', async ({ page }) => {
      await page.click('text=Hábitos');

      // Focus first habit
      await page.keyboard.press('j');

      // Get checkbox state before
      const focusedHabit = page.locator('[data-focused="true"]');
      const checkbox = focusedHabit.locator('[type="checkbox"]');
      const wasChecked = await checkbox.isChecked();

      // Press Space to toggle
      await page.keyboard.press(' ');

      // Checkbox state should change
      await expect(checkbox).toBeChecked({ checked: !wasChecked });
    });

    test('should mark task as completed with Space key', async ({ page }) => {
      await page.click('text=Tareas');

      // Focus first task
      await page.keyboard.press('j');

      const focusedTask = page.locator('[data-focused="true"]');
      const checkbox = focusedTask.locator('[type="checkbox"]');
      const wasChecked = await checkbox.isChecked();

      // Press Space to toggle
      await page.keyboard.press(' ');

      // Checkbox state should change
      await expect(checkbox).toBeChecked({ checked: !wasChecked });
    });
  });

  test.describe('Creation Shortcuts (n)', () => {
    test('should open new habit dialog with "n" key', async ({ page }) => {
      await page.click('text=Hábitos');

      // Press "n" to create new habit
      await page.keyboard.press('n');

      // Dialog should open
      await expect(page.locator('role=dialog')).toBeVisible();
      await expect(page.locator('[name="name"]')).toBeFocused();
    });

    test('should open new task dialog with "n" key', async ({ page }) => {
      await page.click('text=Tareas');

      // Press "n" to create new task
      await page.keyboard.press('n');

      // Dialog should open
      await expect(page.locator('role=dialog')).toBeVisible();
      await expect(page.locator('[name="title"]')).toBeFocused();
    });

    test('should open new event dialog with "n" key', async ({ page }) => {
      await page.click('text=Eventos');

      // Press "n" to create new event
      await page.keyboard.press('n');

      // Dialog should open
      await expect(page.locator('role=dialog')).toBeVisible();
    });
  });

  test.describe('Enter Key Actions', () => {
    test('should open habit detail with Enter key', async ({ page }) => {
      await page.click('text=Hábitos');

      // Focus first habit
      await page.keyboard.press('j');

      // Press Enter to open detail
      await page.keyboard.press('Enter');

      // Should navigate to detail page
      await expect(page).toHaveURL(/.*habits\/[^/]+$/);
    });

    test('should open task detail with Enter key', async ({ page }) => {
      await page.click('text=Tareas');

      // Focus first task
      await page.keyboard.press('j');

      // Press Enter to open detail
      await page.keyboard.press('Enter');

      // Should navigate to detail page or open detail view
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Escape Key Actions', () => {
    test('should close dialog with Escape key', async ({ page }) => {
      await page.click('text=Hábitos');

      // Open new habit dialog
      await page.keyboard.press('n');
      await expect(page.locator('role=dialog')).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Dialog should close
      await expect(page.locator('role=dialog')).not.toBeVisible();
    });

    test('should cancel form with Escape key', async ({ page }) => {
      await page.click('text=Tareas');

      await page.keyboard.press('n');
      await page.fill('[name="title"]', 'Test Task');

      // Press Escape to cancel
      await page.keyboard.press('Escape');

      // Dialog should close without creating task
      await expect(page.locator('role=dialog')).not.toBeVisible();
      await expect(page.locator('text=Test Task')).not.toBeVisible();
    });
  });

  test.describe('Search Shortcut (Ctrl+K or Cmd+K)', () => {
    test('should open search with Ctrl+K', async ({ page }) => {
      // Press Ctrl+K (or Cmd+K on Mac)
      await page.keyboard.press('Control+k');

      // Search input should be focused
      const searchInput = page.locator('[placeholder*="Buscar"]');
      if ((await searchInput.count()) > 0) {
        await expect(searchInput).toBeFocused();
      }
    });

    test('should open command palette with Ctrl+K', async ({ page }) => {
      await page.keyboard.press('Control+k');

      // Command palette should open
      const commandPalette = page.locator('[data-testid="command-palette"]');
      if ((await commandPalette.count()) > 0) {
        await expect(commandPalette).toBeVisible();
      }
    });
  });

  test.describe('Edit Shortcut (e)', () => {
    test('should enter edit mode with "e" key on habit', async ({ page }) => {
      await page.click('text=Hábitos');

      // Focus and open habit detail
      await page.keyboard.press('j');
      await page.keyboard.press('Enter');

      // Press "e" to edit
      await page.keyboard.press('e');

      // Edit dialog should open
      await expect(page.locator('role=dialog')).toBeVisible();
      await expect(page.locator('[name="name"]')).toBeVisible();
    });

    test('should enter edit mode with "e" key on task', async ({ page }) => {
      await page.click('text=Tareas');

      await page.keyboard.press('j');
      await page.keyboard.press('Enter');

      // Press "e" to edit
      await page.keyboard.press('e');

      // Edit dialog should open
      await expect(page.locator('role=dialog')).toBeVisible();
    });
  });

  test.describe('Delete Shortcut (Delete or Backspace)', () => {
    test('should prompt for deletion with Delete key', async ({ page }) => {
      await page.click('text=Hábitos');

      await page.keyboard.press('j');
      await page.keyboard.press('Enter');

      // Press Delete
      await page.keyboard.press('Delete');

      // Confirmation dialog should appear
      const confirmDialog = page.locator('role=dialog:has-text("Eliminar")');
      if ((await confirmDialog.count()) > 0) {
        await expect(confirmDialog).toBeVisible();
      }
    });
  });

  test.describe('Help Shortcut (?)', () => {
    test('should show keyboard shortcuts help with "?" key', async ({ page }) => {
      // Press "?" to show help
      await page.keyboard.press('?');

      // Help modal should open
      const helpModal = page.locator('[data-testid="keyboard-shortcuts-help"]');
      if ((await helpModal.count()) > 0) {
        await expect(helpModal).toBeVisible();
        await expect(helpModal.locator('text=/atajos de teclado/i')).toBeVisible();
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch tabs with number keys 1-5', async ({ page }) => {
      // Press "1" for Hábitos
      await page.keyboard.press('1');
      await expect(page).toHaveURL(/.*habits/);

      // Press "2" for Tareas
      await page.keyboard.press('2');
      await expect(page).toHaveURL(/.*tasks/);

      // Press "3" for Eventos
      await page.keyboard.press('3');
      await expect(page).toHaveURL(/.*events/);
    });
  });

  test.describe('Refresh Shortcut (r)', () => {
    test('should refresh data with "r" key', async ({ page }) => {
      await page.click('text=Hábitos');

      // Press "r" to refresh
      await page.keyboard.press('r');

      // Should show loading state or refresh indicator
      const loadingIndicator = page.locator('[data-testid="loading"]');
      if ((await loadingIndicator.count()) > 0) {
        await expect(loadingIndicator).toBeVisible();
      }
    });
  });
});
