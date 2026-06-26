/**
 * Data Retention Cron Job (S-02.4)
 *
 * Two responsibilities, with very different risk profiles:
 *
 * 1. purgeExpiredTokens() — ALWAYS runs. Deletes password-reset and email-
 *    verification tokens that are expired or already used. Pure data
 *    minimization; nothing user-facing is lost.
 *
 * 2. purgeInactiveAccounts() — DESTRUCTIVE. Permanently deletes accounts whose
 *    last login (or creation, if never logged in) is older than
 *    INACTIVE_ACCOUNT_PURGE_DAYS. To avoid ever silently mass-deleting real
 *    users, it only deletes when BOTH env flags are set:
 *      - INACTIVE_ACCOUNT_PURGE_DAYS > 0
 *      - INACTIVE_ACCOUNT_PURGE_ENABLED === 'true'
 *    Otherwise it runs in DRY-RUN and only logs what it WOULD delete.
 *
 *    NOTE: A production rollout should send a warning email before deletion and
 *    honor a grace period. That is intentionally out of scope here — keep the
 *    enable flag off until that exists.
 *
 * Schedule: daily at 03:30.
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { deleteAccount } from '../services/accountDeletion.service.js';

/** Deletes expired or used auth tokens. Returns counts. */
export async function purgeExpiredTokens(): Promise<{
  resetTokens: number;
  verificationTokens: number;
}> {
  const now = new Date();
  const staleWhere = {
    OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
  };

  const [resetTokens, verificationTokens] = await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: staleWhere }),
    prisma.emailVerificationToken.deleteMany({ where: staleWhere }),
  ]);

  logger.info('[retention] purged expired auth tokens', {
    resetTokens: resetTokens.count,
    verificationTokens: verificationTokens.count,
  });

  return { resetTokens: resetTokens.count, verificationTokens: verificationTokens.count };
}

/**
 * Finds (and, if enabled, deletes) accounts inactive beyond the threshold.
 * Returns the ids considered inactive and whether they were actually deleted.
 */
export async function purgeInactiveAccounts(): Promise<{ candidates: string[]; deleted: boolean }> {
  const days = parseInt(env.INACTIVE_ACCOUNT_PURGE_DAYS, 10);
  const enabled = env.INACTIVE_ACCOUNT_PURGE_ENABLED === 'true' && days > 0;

  if (!days || days <= 0) {
    logger.info('[retention] inactive-account purge disabled (no threshold configured)');
    return { candidates: [], deleted: false };
  }

  const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Inactive = never logged in since `threshold`. Fall back to createdAt for
  // users that have never logged in at all.
  const candidates = await prisma.user.findMany({
    where: {
      OR: [{ lastLoginAt: { lt: threshold } }, { lastLoginAt: null, createdAt: { lt: threshold } }],
    },
    select: { id: true },
  });

  const ids = candidates.map((u) => u.id);

  if (!enabled) {
    logger.warn(
      '[retention] inactive-account purge DRY-RUN (set INACTIVE_ACCOUNT_PURGE_ENABLED=true to delete)',
      {
        thresholdDays: days,
        wouldDelete: ids.length,
      }
    );
    return { candidates: ids, deleted: false };
  }

  let deleted = 0;
  for (const id of ids) {
    try {
      await deleteAccount(id);
      deleted += 1;
    } catch (error) {
      logger.error('[retention] failed to delete inactive account', { userId: id, error });
    }
  }

  logger.info('[retention] inactive-account purge complete', { thresholdDays: days, deleted });
  return { candidates: ids, deleted: true };
}

export async function runRetention(): Promise<void> {
  await purgeExpiredTokens();
  await purgeInactiveAccounts();
}

export function scheduleRetentionJob(): cron.ScheduledTask {
  logger.info('[retention] scheduling daily job at 03:30');
  return cron.schedule('30 3 * * *', async () => {
    try {
      await runRetention();
    } catch (error) {
      logger.error('[retention] scheduled run failed', { error });
    }
  });
}

export default { purgeExpiredTokens, purgeInactiveAccounts, runRetention, scheduleRetentionJob };
