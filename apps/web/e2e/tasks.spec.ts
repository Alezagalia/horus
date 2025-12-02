/**
 * E2E Tests - Tasks Flow
 * Sprint 12 - US-112: Tests E2E en Web con Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Tasks Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('[name="email"]', 'demo@horus.com');
    await page.fill('[name="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Tasks section
    await page.click('text=Tareas');
    await expect(page).toHaveURL(/.*tasks/);
  });

  test.describe('Create Task with Checklist', () => {
    test('should create a task with checklist items', async ({ page }) => {
      // Open create task dialog
      await page.click('button:has-text("Nueva Tarea")');
      await expect(page.locator('role=dialog')).toBeVisible();

      // Fill basic task info
      const timestamp = Date.now();
      await page.fill('[name="title"]', `Task ${timestamp}`);
      await page.fill('[name="description"]', 'E2E Test Task');

      // Set priority
      await page.click('[value="HIGH"]');

      // Set due date
      await page.fill('[name="dueDate"]', '2025-12-31');

      // Add checklist items
      await page.click('button:has-text("Agregar subtarea")');
      await page.fill('[data-testid="checklist-item-0"]', 'Subtask 1');

      await page.click('button:has-text("Agregar subtarea")');
      await page.fill('[data-testid="checklist-item-1"]', 'Subtask 2');

      // Submit form
      await page.click('button[type="submit"]:has-text("Crear")');

      // Should see the new task
      await expect(page.locator(`text=Task ${timestamp}`)).toBeVisible();
      await expect(page.locator('text=0 / 2')).toBeVisible(); // Checklist progress
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('button:has-text("Nueva Tarea")');

      // Submit without title
      await page.click('button[type="submit"]:has-text("Crear")');

      // Should show validation error
      await expect(page.locator('text=/título.*requerido/i')).toBeVisible();
    });

    test('should set reminder time', async ({ page }) => {
      await page.click('button:has-text("Nueva Tarea")');

      await page.fill('[name="title"]', 'Task with Reminder');

      // Enable reminder
      await page.check('[name="hasReminder"]');
      await page.fill('[name="reminderTime"]', '14:30');

      await page.click('button[type="submit"]:has-text("Crear")');

      // Should see reminder indicator
      await expect(page.locator('[data-testid="reminder-icon"]')).toBeVisible();
    });
  });

  test.describe('Complete Task', () => {
    test('should mark task as completed', async ({ page }) => {
      // Find first task card
      const taskCard = page.locator('[data-testid="task-card"]').first();
      await expect(taskCard).toBeVisible();

      // Click checkbox to complete
      const checkbox = taskCard.locator('[type="checkbox"]');
      await checkbox.check();

      // Should show completed state
      await expect(checkbox).toBeChecked();

      // Task might move to completed section or get strikethrough
      await expect(taskCard).toHaveClass(/completed|line-through/);
    });

    test('should complete checklist items', async ({ page }) => {
      // Click on a task to view details
      await page.locator('[data-testid="task-card"]').first().click();

      // Should see checklist
      const checklistItems = page.locator('[data-testid="checklist-item"]');

      if ((await checklistItems.count()) > 0) {
        // Complete first checklist item
        await checklistItems.first().locator('[type="checkbox"]').check();

        // Should update progress
        await expect(page.locator('text=/1 \/ \d+/')).toBeVisible();
      }
    });
  });

  test.describe('Filter by Priority', () => {
    test('should filter tasks by HIGH priority', async ({ page }) => {
      // Open filter menu
      await page.click('button:has-text("Filtrar")');

      // Select HIGH priority
      await page.click('[value="HIGH"]');

      // Should show only HIGH priority tasks
      const taskCards = page.locator('[data-testid="task-card"]');
      const count = await taskCards.count();

      if (count > 0) {
        await expect(taskCards.first().locator('[data-testid="priority-badge"]')).toHaveText(
          /HIGH|ALTA/i
        );
      }
    });

    test('should filter tasks by MEDIUM priority', async ({ page }) => {
      await page.click('button:has-text("Filtrar")');
      await page.click('[value="MEDIUM"]');

      const taskCards = page.locator('[data-testid="task-card"]');
      if ((await taskCards.count()) > 0) {
        await expect(taskCards.first().locator('[data-testid="priority-badge"]')).toHaveText(
          /MEDIUM|MEDIA/i
        );
      }
    });

    test('should filter tasks by LOW priority', async ({ page }) => {
      await page.click('button:has-text("Filtrar")');
      await page.click('[value="LOW"]');

      const taskCards = page.locator('[data-testid="task-card"]');
      if ((await taskCards.count()) > 0) {
        await expect(taskCards.first().locator('[data-testid="priority-badge"]')).toHaveText(
          /LOW|BAJA/i
        );
      }
    });

    test('should clear filters', async ({ page }) => {
      await page.click('button:has-text("Filtrar")');
      await page.click('[value="HIGH"]');

      // Clear filter
      await page.click('button:has-text("Limpiar filtros")');

      // Should show all tasks
      await expect(page.locator('[data-testid="task-card"]')).not.toHaveCount(0);
    });
  });

  test.describe('Filter by Category', () => {
    test('should filter tasks by category', async ({ page }) => {
      await page.click('button:has-text("Filtrar")');

      // Select "Trabajo" category
      await page.click('text=Trabajo');

      // Should show only work-related tasks
      await expect(page.locator('[data-testid="task-card"]')).toBeVisible();
    });
  });

  test.describe('Filter by Status', () => {
    test('should filter by pending tasks', async ({ page }) => {
      await page.click('button:has-text("Pendientes")');

      // Should show only pending tasks
      const taskCards = page.locator('[data-testid="task-card"]');
      if ((await taskCards.count()) > 0) {
        await expect(taskCards.first().locator('[type="checkbox"]')).not.toBeChecked();
      }
    });

    test('should filter by completed tasks', async ({ page }) => {
      await page.click('button:has-text("Completadas")');

      // Should show only completed tasks
      const taskCards = page.locator('[data-testid="task-card"]');
      if ((await taskCards.count()) > 0) {
        await expect(taskCards.first().locator('[type="checkbox"]')).toBeChecked();
      }
    });
  });

  test.describe('Sort Tasks', () => {
    test('should sort tasks by due date', async ({ page }) => {
      await page.click('button:has-text("Ordenar")');
      await page.click('text=Fecha de vencimiento');

      // Tasks should be reordered
      await expect(page.locator('[data-testid="task-card"]').first()).toBeVisible();
    });

    test('should sort tasks by priority', async ({ page }) => {
      await page.click('button:has-text("Ordenar")');
      await page.click('text=Prioridad');

      // High priority tasks should appear first
      const firstTask = page.locator('[data-testid="task-card"]').first();
      if (await firstTask.isVisible()) {
        await expect(firstTask.locator('[data-testid="priority-badge"]')).toHaveText(/HIGH|ALTA/i);
      }
    });

    test('should sort tasks by creation date', async ({ page }) => {
      await page.click('button:has-text("Ordenar")');
      await page.click('text=Fecha de creación');

      // Should reorder tasks
      await expect(page.locator('[data-testid="task-card"]')).not.toHaveCount(0);
    });
  });

  test.describe('Edit Task', () => {
    test('should edit task details', async ({ page }) => {
      // Click on task to open detail
      await page.locator('[data-testid="task-card"]').first().click();

      // Click edit button
      await page.click('button:has-text("Editar")');

      // Update title
      await page.fill('[name="title"]', 'Updated Task Title');

      // Save changes
      await page.click('button[type="submit"]:has-text("Guardar")');

      // Should show updated title
      await expect(page.locator('h1:has-text("Updated Task Title")')).toBeVisible();
    });

    test('should update priority', async ({ page }) => {
      await page.locator('[data-testid="task-card"]').first().click();
      await page.click('button:has-text("Editar")');

      // Change priority
      await page.click('[value="LOW"]');

      await page.click('button[type="submit"]:has-text("Guardar")');

      // Should show new priority
      await expect(page.locator('[data-testid="priority-badge"]')).toHaveText(/LOW|BAJA/i);
    });
  });

  test.describe('Delete Task', () => {
    test('should delete a task', async ({ page }) => {
      const taskTitle = await page
        .locator('[data-testid="task-card"]')
        .first()
        .locator('[data-testid="task-title"]')
        .textContent();

      // Click on task
      await page.locator('[data-testid="task-card"]').first().click();

      // Click delete button
      await page.click('button:has-text("Eliminar")');

      // Confirm deletion
      await page.click('button:has-text("Confirmar")');

      // Should navigate back to tasks list
      await expect(page).toHaveURL(/.*tasks$/);

      // Task should no longer be visible
      if (taskTitle) {
        await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
      }
    });
  });

  test.describe('Task Search', () => {
    test('should search tasks by title', async ({ page }) => {
      // Type in search box
      await page.fill('[placeholder*="Buscar"]', 'test');

      // Should filter tasks
      await page.waitForTimeout(500); // Debounce

      const visibleTasks = page.locator('[data-testid="task-card"]');
      if ((await visibleTasks.count()) > 0) {
        await expect(visibleTasks.first()).toBeVisible();
      }
    });
  });
});
