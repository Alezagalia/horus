/**
 * Habit Reminder Notifications Cron Job
 *
 * Cada 5 minutos revisa hábitos con recordatorio habilitado
 * (NotificationSetting.time, hora ART) que aún no fueron completados ni
 * avisados hoy, y envía el push.
 */

import cron from 'node-cron';
import { notifyHabitReminders } from '../services/habitReminderNotification.service.js';
import { logger } from '../lib/logger.js';

export function scheduleHabitReminderNotifications(): cron.ScheduledTask {
  logger.info('[Habit Reminders] Scheduling job every 5 minutes...');

  const task = cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await notifyHabitReminders();
      if (result.remindersSent > 0) {
        logger.info(`[Habit Reminders] Done. remindersSent=${result.remindersSent}`);
      }
    } catch (error) {
      logger.error('[Habit Reminders] Scheduled task failed:', error);
    }
  });

  logger.info('[Habit Reminders] Scheduled successfully.');
  return task;
}

export default { scheduleHabitReminderNotifications };
