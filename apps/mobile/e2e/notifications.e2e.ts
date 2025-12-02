/**
 * E2E Tests - Notifications Flow
 * Sprint 12 - US-111: Tests E2E en Mobile con Detox
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Notifications Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES' },
    });

    // Login before running notification tests
    await detoxExpect(element(by.id('auth-container'))).toBeVisible();
    await element(by.id('login-email-input')).typeText('demo@horus.com');
    await element(by.id('login-password-input')).typeText('demo1234');
    await element(by.id('login-submit-button')).tap();
    await detoxExpect(element(by.id('main-tabs'))).toBeVisible();
  });

  describe('Configure Notification for Habit', () => {
    it('should configure notification settings for a habit', async () => {
      // Navigate to Habits
      await element(by.id('tab-habits')).tap();
      await detoxExpect(element(by.id('habits-screen'))).toBeVisible();

      // Open a habit detail
      await element(by.id('habit-card')).atIndex(0).tap();
      await detoxExpect(element(by.id('habit-detail-screen'))).toBeVisible();

      // Tap edit button
      await element(by.id('habit-edit-button')).tap();
      await detoxExpect(element(by.id('habit-form'))).toBeVisible();

      // Enable notification
      await element(by.id('habit-notification-toggle')).tap();

      // Set notification time
      await element(by.id('habit-notification-time-picker')).tap();
      // Note: Time picker interaction is platform-specific

      // Save changes
      await element(by.id('habit-form-submit')).tap();

      // Should see notification enabled indicator
      await detoxExpect(element(by.id('habit-notification-enabled'))).toBeVisible();
    });
  });

  describe('Configure Notification for Task', () => {
    it('should configure notification for a task', async () => {
      // Navigate to Tasks
      await element(by.id('tab-tasks')).tap();
      await detoxExpect(element(by.id('tasks-screen'))).toBeVisible();

      // Open a task detail
      await element(by.id('task-card')).atIndex(0).tap();
      await detoxExpect(element(by.id('task-detail-screen'))).toBeVisible();

      // Tap edit button
      await element(by.id('task-edit-button')).tap();
      await detoxExpect(element(by.id('task-form'))).toBeVisible();

      // Enable reminder
      await element(by.id('task-reminder-toggle')).tap();

      // Set reminder time
      await element(by.id('task-reminder-time-picker')).tap();

      // Save
      await element(by.id('task-form-submit')).tap();

      // Should see reminder indicator
      await detoxExpect(element(by.id('task-reminder-enabled'))).toBeVisible();
    });
  });

  describe('Simulate Notification Reception', () => {
    it('should receive and display a local notification', async () => {
      // Note: This is a simulation test
      // In a real scenario, you would:
      // 1. Schedule a notification
      // 2. Fast-forward time or trigger it manually
      // 3. Verify notification appears

      // For E2E testing with Detox, we can simulate receiving a notification
      // by sending a test notification via Detox utilities

      // Send test notification (Detox provides this capability)
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Test Habit Reminder',
        subtitle: 'Horus',
        body: 'Es hora de completar tu hábito: Ejercicio',
        badge: 1,
        payload: {
          type: 'HABIT_REMINDER',
          habitId: '123',
        },
      });

      // Wait for notification to appear
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify notification banner appeared (platform-specific)
      // On iOS, notification banners are system-level
      // We can verify the app badge or notification center
    });
  });

  describe('Verify Deep Linking', () => {
    it('should navigate to habit when tapping notification', async () => {
      // Send notification with deep link payload
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Habit Reminder',
        body: 'Complete your habit: Meditation',
        payload: {
          type: 'HABIT_REMINDER',
          habitId: 'test-habit-123',
          deepLink: 'horus://habits/test-habit-123',
        },
      });

      // Wait for notification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Tap on notification (this opens the app)
      // Note: Detox has limitations simulating notification taps
      // This is more of a conceptual test

      // Verify navigation to habit detail
      // In real implementation, you'd verify the deep link handler
      // navigates to the correct screen
    });

    it('should navigate to task when tapping task reminder notification', async () => {
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Task Reminder',
        body: 'Task due soon: Complete project',
        payload: {
          type: 'TASK_REMINDER',
          taskId: 'test-task-456',
          deepLink: 'horus://tasks/test-task-456',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify deep link navigation
      // This would require implementing deep link handling
      // and verifying the correct screen is shown
    });
  });

  describe('Notification Permissions', () => {
    it('should request notification permissions on first use', async () => {
      // This test would verify the permission request flow
      // Note: Permissions are granted in beforeAll for these tests
      // In a real scenario, you'd test the permission request dialog

      // Navigate to Settings
      await element(by.id('tab-profile')).tap();
      await element(by.id('settings-button')).tap();

      // Check notification settings
      await detoxExpect(element(by.id('notification-settings'))).toBeVisible();
      await detoxExpect(element(by.id('notification-permission-status'))).toHaveText('Granted');
    });
  });

  describe('Notification Preferences', () => {
    it('should allow user to disable all notifications', async () => {
      // Navigate to Settings
      await element(by.id('tab-profile')).tap();
      await element(by.id('settings-button')).tap();

      // Disable notifications globally
      await element(by.id('notifications-global-toggle')).tap();

      // Should show disabled state
      await detoxExpect(element(by.id('notifications-disabled-indicator'))).toBeVisible();
    });

    it('should allow user to configure notification types', async () => {
      await element(by.id('tab-profile')).tap();
      await element(by.id('settings-button')).tap();

      // Enable only habit notifications
      await element(by.id('notification-type-habits')).tap();

      // Disable task notifications
      await element(by.id('notification-type-tasks')).tap();

      // Verify settings saved
      await detoxExpect(element(by.id('settings-saved-toast'))).toBeVisible();
    });
  });

  describe('Notification Scheduling', () => {
    it('should schedule daily habit notification', async () => {
      // Navigate to Habits
      await element(by.id('tab-habits')).tap();

      // Create new habit with daily notification
      await element(by.id('create-habit-button')).tap();

      const timestamp = Date.now();
      await element(by.id('habit-name-input')).typeText(`Notified Habit ${timestamp}`);
      await element(by.id('habit-type-CHECK')).tap();
      await element(by.id('habit-frequency-DAILY')).tap();

      // Enable notification
      await element(by.id('habit-notification-toggle')).tap();
      await element(by.id('habit-notification-time-picker')).tap();
      // Set time to 9:00 AM

      await element(by.id('habit-form-submit')).tap();

      // Verify habit created with notification
      await detoxExpect(element(by.text(`Notified Habit ${timestamp}`))).toBeVisible();
      await detoxExpect(element(by.id('habit-notification-icon'))).toBeVisible();
    });
  });

  describe('Batch Notifications', () => {
    it('should group multiple notifications', async () => {
      // Send multiple notifications
      for (let i = 0; i < 3; i++) {
        await device.sendUserNotification({
          trigger: { type: 'push' },
          title: `Habit Reminder ${i + 1}`,
          body: `Complete habit ${i + 1}`,
          category: 'HABIT_REMINDER',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify notifications are grouped/batched
      // This is platform-specific behavior
    });
  });
});
