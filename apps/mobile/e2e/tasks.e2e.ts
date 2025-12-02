/**
 * E2E Tests - Tasks Flow
 * Sprint 12 - US-111: Tests E2E en Mobile con Detox
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Tasks Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES' },
    });

    // Login before running task tests
    await detoxExpect(element(by.id('auth-container'))).toBeVisible();
    await element(by.id('login-email-input')).typeText('demo@horus.com');
    await element(by.id('login-password-input')).typeText('demo1234');
    await element(by.id('login-submit-button')).tap();
    await detoxExpect(element(by.id('main-tabs'))).toBeVisible();
  });

  beforeEach(async () => {
    // Navigate to Tasks tab
    await element(by.id('tab-tasks')).tap();
    await detoxExpect(element(by.id('tasks-screen'))).toBeVisible();
  });

  describe('Create Task with Checklist', () => {
    it('should create a task with checklist items', async () => {
      // Open create task form
      await element(by.id('create-task-button')).tap();
      await detoxExpect(element(by.id('task-form'))).toBeVisible();

      // Fill basic task info
      const timestamp = Date.now();
      await element(by.id('task-title-input')).typeText(`Task ${timestamp}`);
      await element(by.id('task-description-input')).typeText('E2E Test Task');

      // Set priority
      await element(by.id('task-priority-HIGH')).tap();

      // Set due date
      await element(by.id('task-due-date-picker')).tap();
      // Note: Date picker interaction depends on platform

      // Add checklist items
      await element(by.id('add-checklist-item-button')).tap();
      await element(by.id('checklist-item-input-0')).typeText('Subtask 1');

      await element(by.id('add-checklist-item-button')).tap();
      await element(by.id('checklist-item-input-1')).typeText('Subtask 2');

      // Submit form
      await element(by.id('task-form-submit')).tap();

      // Should see the new task
      await detoxExpect(element(by.text(`Task ${timestamp}`))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('create-task-button')).tap();
      await detoxExpect(element(by.id('task-form'))).toBeVisible();

      // Try to submit without title
      await element(by.id('task-form-submit')).tap();

      // Should show validation error
      await detoxExpect(element(by.text(/título es requerido/i))).toBeVisible();
    });
  });

  describe('Complete Task', () => {
    it('should mark task as completed', async () => {
      // Find first task card
      const taskCard = element(by.id('task-card')).atIndex(0);
      await detoxExpect(taskCard).toBeVisible();

      // Tap checkbox to complete
      await element(by.id('task-checkbox')).atIndex(0).tap();

      // Should show completed state (might move to completed tab)
      // Verify task is marked as complete
      await element(by.id('tasks-filter-completed')).tap();
      await detoxExpect(element(by.id('task-card-completed')).atIndex(0)).toBeVisible();
    });

    it('should complete checklist items', async () => {
      // Tap on a task to view details
      await element(by.id('task-card')).atIndex(0).tap();
      await detoxExpect(element(by.id('task-detail-screen'))).toBeVisible();

      // Should see checklist
      await detoxExpect(element(by.id('task-checklist'))).toBeVisible();

      // Complete first checklist item
      await element(by.id('checklist-item-checkbox-0')).tap();

      // Should show updated progress
      await detoxExpect(element(by.text(/1\/2/))).toBeVisible();
    });
  });

  describe('Filter by Priority', () => {
    it('should filter tasks by HIGH priority', async () => {
      // Open filter menu
      await element(by.id('tasks-filter-button')).tap();

      // Select HIGH priority filter
      await element(by.id('filter-priority-HIGH')).tap();

      // Should show only HIGH priority tasks
      await detoxExpect(element(by.id('tasks-list'))).toBeVisible();
      await detoxExpect(element(by.id('task-priority-badge-HIGH')).atIndex(0)).toBeVisible();
    });

    it('should filter tasks by MEDIUM priority', async () => {
      await element(by.id('tasks-filter-button')).tap();
      await element(by.id('filter-priority-MEDIUM')).tap();

      await detoxExpect(element(by.id('tasks-list'))).toBeVisible();
      await detoxExpect(element(by.id('task-priority-badge-MEDIUM')).atIndex(0)).toBeVisible();
    });

    it('should clear filters', async () => {
      await element(by.id('tasks-filter-button')).tap();
      await element(by.id('filter-priority-HIGH')).tap();

      // Clear filter
      await element(by.id('filter-clear-button')).tap();

      // Should show all tasks
      await detoxExpect(element(by.id('tasks-list'))).toBeVisible();
    });
  });

  describe('Task Categories', () => {
    it('should filter tasks by category', async () => {
      await element(by.id('tasks-filter-button')).tap();
      await element(by.id('filter-category-trabajo')).tap();

      // Should show only work-related tasks
      await detoxExpect(element(by.id('tasks-list'))).toBeVisible();
    });
  });

  describe('Task Sorting', () => {
    it('should sort tasks by due date', async () => {
      await element(by.id('tasks-sort-button')).tap();
      await element(by.id('sort-by-dueDate')).tap();

      // Should re-order tasks
      await detoxExpect(element(by.id('tasks-list'))).toBeVisible();
    });

    it('should sort tasks by priority', async () => {
      await element(by.id('tasks-sort-button')).tap();
      await element(by.id('sort-by-priority')).tap();

      // Should re-order tasks (HIGH first)
      await detoxExpect(element(by.id('tasks-list'))).toBeVisible();
    });
  });

  describe('Edit Task', () => {
    it('should edit task details', async () => {
      // Tap on a task
      await element(by.id('task-card')).atIndex(0).tap();
      await detoxExpect(element(by.id('task-detail-screen'))).toBeVisible();

      // Tap edit button
      await element(by.id('task-edit-button')).tap();
      await detoxExpect(element(by.id('task-form'))).toBeVisible();

      // Update title
      await element(by.id('task-title-input')).clearText();
      await element(by.id('task-title-input')).typeText('Updated Task Title');

      // Submit
      await element(by.id('task-form-submit')).tap();

      // Should see updated title
      await detoxExpect(element(by.text('Updated Task Title'))).toBeVisible();
    });
  });

  describe('Delete Task', () => {
    it('should delete a task', async () => {
      // Tap on a task
      await element(by.id('task-card')).atIndex(0).tap();
      await detoxExpect(element(by.id('task-detail-screen'))).toBeVisible();

      // Tap delete button
      await element(by.id('task-delete-button')).tap();

      // Confirm deletion
      await element(by.id('confirm-delete-button')).tap();

      // Should navigate back to tasks list
      await detoxExpect(element(by.id('tasks-screen'))).toBeVisible();
    });
  });
});
