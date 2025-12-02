/**
 * E2E Tests - Habits Flow
 * Sprint 12 - US-111: Tests E2E en Mobile con Detox
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('Habits Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES' },
    });

    // Login before running habit tests
    await detoxExpect(element(by.id('auth-container'))).toBeVisible();
    await element(by.id('login-email-input')).typeText('demo@horus.com');
    await element(by.id('login-password-input')).typeText('demo1234');
    await element(by.id('login-submit-button')).tap();
    await detoxExpect(element(by.id('main-tabs'))).toBeVisible();
  });

  beforeEach(async () => {
    // Navigate to Habits tab
    await element(by.id('tab-habits')).tap();
    await detoxExpect(element(by.id('habits-screen'))).toBeVisible();
  });

  describe('Create Habit - CHECK type', () => {
    it('should create a CHECK habit successfully', async () => {
      // Open create habit modal
      await element(by.id('create-habit-button')).tap();
      await detoxExpect(element(by.id('habit-form'))).toBeVisible();

      // Fill habit form
      const timestamp = Date.now();
      await element(by.id('habit-name-input')).typeText(`Check Habit ${timestamp}`);
      await element(by.id('habit-description-input')).typeText('E2E Test Habit');

      // Select CHECK type (default)
      await detoxExpect(element(by.id('habit-type-CHECK'))).toBeVisible();
      await element(by.id('habit-type-CHECK')).tap();

      // Select frequency
      await element(by.id('habit-frequency-DAILY')).tap();

      // Set reminder time
      await element(by.id('habit-reminder-toggle')).tap();
      await element(by.id('habit-reminder-time')).tap();
      // Note: Time picker interaction depends on platform

      // Submit form
      await element(by.id('habit-form-submit')).tap();

      // Should see the new habit in the list
      await detoxExpect(element(by.text(`Check Habit ${timestamp}`))).toBeVisible();
    });
  });

  describe('Create Habit - NUMERIC type', () => {
    it('should create a NUMERIC habit successfully', async () => {
      await element(by.id('create-habit-button')).tap();
      await detoxExpect(element(by.id('habit-form'))).toBeVisible();

      const timestamp = Date.now();
      await element(by.id('habit-name-input')).typeText(`Numeric Habit ${timestamp}`);
      await element(by.id('habit-description-input')).typeText('E2E Numeric Test');

      // Select NUMERIC type
      await element(by.id('habit-type-NUMERIC')).tap();

      // Set target and unit
      await element(by.id('habit-target-input')).typeText('8');
      await element(by.id('habit-unit-input')).typeText('vasos');

      // Select frequency
      await element(by.id('habit-frequency-DAILY')).tap();

      // Submit form
      await element(by.id('habit-form-submit')).tap();

      // Should see the new habit
      await detoxExpect(element(by.text(`Numeric Habit ${timestamp}`))).toBeVisible();
    });
  });

  describe('View Habits Today', () => {
    it("should display today's habits", async () => {
      // Should see the habits screen with today's date
      await detoxExpect(element(by.id('habits-screen'))).toBeVisible();
      await detoxExpect(element(by.id('habits-date-header'))).toBeVisible();

      // Should see habit cards
      await detoxExpect(element(by.id('habits-list'))).toBeVisible();
    });

    it('should filter habits by category', async () => {
      // Open filter menu
      await element(by.id('habits-filter-button')).tap();

      // Select a category
      await element(by.id('filter-category-salud')).tap();

      // Should show only habits from that category
      await detoxExpect(element(by.id('habits-list'))).toBeVisible();
    });
  });

  describe('Mark Habit as Completed', () => {
    it('should mark a CHECK habit as completed', async () => {
      // Find first habit card
      const habitCard = element(by.id('habit-card')).atIndex(0);
      await detoxExpect(habitCard).toBeVisible();

      // Tap to mark as complete
      await element(by.id('habit-check-button')).atIndex(0).tap();

      // Should show completed state
      await detoxExpect(element(by.id('habit-completed-indicator')).atIndex(0)).toBeVisible();
    });

    it('should update progress for NUMERIC habit', async () => {
      // Find a numeric habit
      const numericHabit = element(by.id('habit-card-NUMERIC')).atIndex(0);
      await detoxExpect(numericHabit).toBeVisible();

      // Open progress input
      await element(by.id('habit-progress-button')).atIndex(0).tap();

      // Enter progress value
      await element(by.id('habit-progress-input')).typeText('5');
      await element(by.id('habit-progress-submit')).tap();

      // Should show updated progress
      await detoxExpect(element(by.text(/5/))).toBeVisible();
    });
  });

  describe('View Statistics', () => {
    it('should navigate to habit statistics', async () => {
      // Tap on a habit to view details
      await element(by.id('habit-card')).atIndex(0).tap();

      // Should navigate to habit detail screen
      await detoxExpect(element(by.id('habit-detail-screen'))).toBeVisible();

      // Should see statistics section
      await detoxExpect(element(by.id('habit-stats-section'))).toBeVisible();

      // Should see streak info
      await detoxExpect(element(by.id('habit-streak-count'))).toBeVisible();

      // Should see completion chart
      await detoxExpect(element(by.id('habit-completion-chart'))).toBeVisible();
    });

    it('should display completion calendar', async () => {
      await element(by.id('habit-card')).atIndex(0).tap();
      await detoxExpect(element(by.id('habit-detail-screen'))).toBeVisible();

      // Scroll to calendar
      await element(by.id('habit-detail-scroll')).scrollTo('bottom');

      // Should see calendar with completion marks
      await detoxExpect(element(by.id('habit-calendar'))).toBeVisible();
    });
  });
});
