/**
 * Daily Event Notifications Cron Job
 *
 * Envía push automáticos con el resumen del día (hábitos pendientes, tareas que
 * vencen hoy y gastos fijos pendientes) a las 08:00 hora de Argentina.
 *
 * Cron: '0 8 * * *' con timezone America/Argentina/Buenos_Aires.
 */

import cron from 'node-cron';
import { notifyDailyEvents } from '../services/dailyEventNotification.service.js';

const TZ = 'America/Argentina/Buenos_Aires';

export function scheduleDailyEventNotifications(): cron.ScheduledTask {
  console.info('[Daily Events Notify] Scheduling daily job at 08:00 ART...');

  const task = cron.schedule(
    '0 8 * * *',
    async () => {
      console.info('[Daily Events Notify] Running scheduled task...');
      try {
        const result = await notifyDailyEvents();
        console.info(
          `[Daily Events Notify] Done. usersNotified=${result.usersNotified} pushesSent=${result.pushesSent}`
        );
      } catch (error) {
        console.error('[Daily Events Notify] Scheduled task failed:', error);
      }
    },
    { timezone: TZ }
  );

  console.info('[Daily Events Notify] Scheduled successfully.');
  return task;
}

export default { scheduleDailyEventNotifications };
