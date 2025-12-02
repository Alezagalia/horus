/**
 * Auto-Complete Habits Cron Job
 * Sprint 4 - US-036 (TECH-002)
 *
 * This cron job runs daily at 00:01 to automatically mark NUMERIC habits as completed
 * when they have reached their target value but the completed flag is still false.
 *
 * Use case: Ensures consistency if a habit reached targetValue but wasn't marked
 * completed due to a bug, network error, or race condition.
 *
 * Schedule: Daily at 00:01 (1 minute after midnight)
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { actualizarRacha } from '../services/streak.service.js';

/**
 * Interface for auto-completion result
 */
interface AutoCompleteResult {
  habitRecordId: string;
  habitId: string;
  habitName: string;
  userId: string;
  date: Date;
  value: number;
  targetValue: number;
}

/**
 * Main function to auto-complete numeric habits
 * Finds all HabitRecords where:
 * - Habit type is NUMERIC
 * - value >= targetValue
 * - completed = false
 * - date is from yesterday (to avoid race conditions with today's records)
 */
export async function autoCompleteNumericHabits(): Promise<AutoCompleteResult[]> {
  const startTime = Date.now();
  console.info('[Auto-Complete Job] Starting auto-complete process...');

  try {
    // Calculate yesterday's date (normalized to start of day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Query: Find all NUMERIC habits that reached target but aren't marked completed
    // We only check yesterday to avoid interfering with today's ongoing tracking
    const habitRecords = await prisma.habitRecord.findMany({
      where: {
        completed: false,
        date: yesterday,
        habit: {
          type: 'NUMERIC',
          isActive: true,
          targetValue: {
            not: null,
          },
        },
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            type: true,
            targetValue: true,
            userId: true,
          },
        },
      },
    });

    console.info(`[Auto-Complete Job] Found ${habitRecords.length} records to check`);

    const autoCompletedRecords: AutoCompleteResult[] = [];

    // Process each record
    for (const record of habitRecords) {
      const { habit, value } = record;

      // Safety check: Only process if value >= targetValue
      if (value !== null && habit.targetValue !== null && value >= habit.targetValue) {
        try {
          // Update the record to completed = true within a transaction
          await prisma.$transaction(async (tx) => {
            // Update HabitRecord
            await tx.habitRecord.update({
              where: { id: record.id },
              data: { completed: true },
            });

            // Recalculate streak (this updates currentStreak, longestStreak, lastCompletedDate)
            await actualizarRacha(habit.id, habit.userId, yesterday, true);
          });

          // Log successful auto-completion
          autoCompletedRecords.push({
            habitRecordId: record.id,
            habitId: habit.id,
            habitName: habit.name,
            userId: habit.userId,
            date: record.date,
            value: value,
            targetValue: habit.targetValue,
          });

          console.info(
            `[Auto-Complete Job] ✓ Auto-completed: "${habit.name}" (${value}/${habit.targetValue})`
          );
        } catch (error) {
          console.error(`[Auto-Complete Job] ✗ Error auto-completing record ${record.id}:`, error);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.info(
      `[Auto-Complete Job] Completed in ${duration}ms. Auto-completed ${autoCompletedRecords.length} habits.`
    );

    return autoCompletedRecords;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Auto-Complete Job] Failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Schedule the cron job
 * Runs daily at 00:01 (1 minute after midnight)
 *
 * Cron expression: '1 0 * * *'
 * - Minute: 1
 * - Hour: 0 (midnight)
 * - Day of month: * (every day)
 * - Month: * (every month)
 * - Day of week: * (every day of week)
 */
export function scheduleAutoCompleteJob(): cron.ScheduledTask {
  console.info('[Auto-Complete Job] Scheduling daily job at 00:01...');

  const task = cron.schedule('1 0 * * *', async () => {
    console.info('[Auto-Complete Job] Running scheduled task...');
    try {
      const results = await autoCompleteNumericHabits();

      // Log summary
      if (results.length > 0) {
        console.info('[Auto-Complete Job] Summary:');
        results.forEach((result) => {
          console.info(
            `  - ${result.habitName}: ${result.value}/${result.targetValue} on ${result.date.toISOString().split('T')[0]}`
          );
        });
      } else {
        console.info('[Auto-Complete Job] No habits needed auto-completion.');
      }
    } catch (error) {
      console.error('[Auto-Complete Job] Scheduled task failed:', error);
    }
  });

  console.info('[Auto-Complete Job] Scheduled successfully.');
  return task;
}

/**
 * Export for manual testing
 * Can be called directly for testing purposes
 */
export default {
  autoCompleteNumericHabits,
  scheduleAutoCompleteJob,
};
