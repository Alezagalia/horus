/**
 * Generate Monthly Expenses Cron Job
 * Sprint 10 - US-093 (TECH-001)
 *
 * Cron job that runs on the 1st of each month at 00:01
 * to automatically generate monthly expense instances for all active recurring expenses
 */

import cron from 'node-cron';
import { generateMonthlyExpenses } from '../services/monthlyExpenseGeneration.service.js';

/**
 * Schedule the monthly expense generation cron job
 * Schedule: '1 0 1 * *' = minute 1, hour 0, day 1 of every month
 */
export function scheduleMonthlyExpenseGeneration(): void {
  // Schedule: minute 1, hour 0, day 1 of every month
  // This runs at 00:01 on the 1st day of each month
  cron.schedule('1 0 1 * *', async () => {
    try {
      console.log('[CRON] Monthly expense generation job started');
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const year = now.getFullYear();

      const result = await generateMonthlyExpenses(month, year);

      console.log('[CRON] Monthly expense generation job completed successfully');
      console.log(`[CRON] Result: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('[CRON] Error in monthly expense generation job:', error);
      // TODO: Integrate with error monitoring service (e.g., Sentry)
    }
  });

  console.log('[CRON] Monthly expense generation job scheduled (1st of each month at 00:01)');
}
