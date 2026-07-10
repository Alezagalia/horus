/**
 * Google Calendar Sync Jobs
 *
 * Dos crons que cierran los gaps de la integración:
 *
 * 1. RETRY (cada 5 min): procesa los eventos cuyo push a Google falló con
 *    error transitorio (429/timeout). `retryFailedSyncs` existía desde
 *    Sprint 8 pero nunca estuvo schedulado — los retries con backoff
 *    exponencial quedaban muertos en la DB.
 *
 * 2. PULL (cada 30 min): importa los cambios hechos EN Google Calendar
 *    (Google→Horus) para cada usuario conectado. Antes solo existía el sync
 *    manual desde la UI. Se gatea por el entitlement `calendarSync` (el
 *    connect es PRO; si el plan venció, el cron no gasta cuota de Google).
 */

import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { googleCalendarSyncService } from '../services/googleCalendarSync.service.js';
import { hasFeature } from '../services/entitlements.service.js';

export async function runRetryFailedSyncs(): Promise<number> {
  const { processed, results } = await googleCalendarSyncService.retryFailedSyncs();
  if (processed > 0) {
    const failed = results.filter((r) => !r.success).length;
    logger.info(
      `[GCal Retry Job] Reintentados ${processed} eventos (${processed - failed} ok, ${failed} fallidos)`
    );
  }
  return processed;
}

export async function runPullFromGoogle(): Promise<void> {
  const settings = await prisma.syncSetting.findMany({
    where: {
      googleCalendarEnabled: true,
      googleRefreshToken: { not: null },
    },
    select: { userId: true },
  });

  for (const { userId } of settings) {
    try {
      if (!(await hasFeature(userId, 'calendarSync'))) continue;

      const result = await googleCalendarSyncService.syncFromGoogle(userId);
      const { eventsImported = 0, eventsUpdated = 0, eventsDeleted = 0 } = result ?? {};
      if (eventsImported + eventsUpdated + eventsDeleted > 0) {
        logger.info(
          `[GCal Pull Job] user ${userId}: +${eventsImported} importados, ~${eventsUpdated} actualizados, -${eventsDeleted} cancelados`
        );
      }
    } catch (error) {
      // Best-effort por usuario: un token vencido no frena a los demás.
      // Los 401 los maneja el propio sync service (needsReconnect).
      logger.warn(`[GCal Pull Job] sync fallido para user ${userId}: ${error}`);
    }
  }
}

export function scheduleGoogleCalendarSyncJobs(): void {
  logger.info('[GCal Sync Jobs] Scheduling retry (*/5 min) y pull (*/30 min)...');

  cron.schedule('*/5 * * * *', async () => {
    try {
      await runRetryFailedSyncs();
    } catch (error) {
      logger.error('[GCal Retry Job] Failed:', error);
    }
  });

  cron.schedule('*/30 * * * *', async () => {
    try {
      await runPullFromGoogle();
    } catch (error) {
      logger.error('[GCal Pull Job] Failed:', error);
    }
  });
}
