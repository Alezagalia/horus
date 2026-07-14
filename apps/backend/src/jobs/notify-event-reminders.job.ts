/**
 * Event Reminder Notifications Cron Job
 *
 * Cada 5 minutos revisa eventos cuyo recordatorio (reminderMinutes antes de
 * startDateTime) ya venció y todavía no fueron notificados, y envía el push.
 */

import cron from 'node-cron';
import { notifyUpcomingEvents } from '../services/eventReminderNotification.service.js';
import { logger } from '../lib/logger.js';

export function scheduleEventReminderNotifications(): cron.ScheduledTask {
  logger.info('[Event Reminders] Scheduling job every 5 minutes...');

  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await notifyUpcomingEvents();
      if (result.eventsNotified > 0) {
        logger.info(
          `[Event Reminders] Done. eventsNotified=${result.eventsNotified} pushesSent=${result.pushesSent}`
        );
      }
    } catch (error) {
      logger.error('[Event Reminders] Scheduled task failed:', error);
    }
  });

  logger.info('[Event Reminders] Scheduled successfully.');
  return task;
}

export default { scheduleEventReminderNotifications };
