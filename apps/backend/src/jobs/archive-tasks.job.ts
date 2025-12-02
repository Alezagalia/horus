/**
 * Archive Tasks Cron Job
 * Sprint 7 - US-059
 *
 * This cron job runs daily at 00:01 to automatically archive completed tasks
 * that have been completed for more than 24 hours.
 *
 * Use case: Keeps the tasks list clean and focused on current/pending tasks
 * by moving old completed tasks to an archived state.
 *
 * Schedule: Daily at 00:01 (1 minute after midnight)
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';

/**
 * Interface for archive result
 */
interface ArchiveResult {
  taskId: string;
  title: string;
  completedAt: Date;
  userId: string;
}

/**
 * Main function to auto-archive completed tasks
 * Finds all Tasks where:
 * - status = 'completada'
 * - completedAt < now() - 24 hours
 * - archivedAt = null
 * - isActive = true
 */
export async function autoArchiveCompletedTasks(): Promise<ArchiveResult[]> {
  const startTime = Date.now();
  console.info('[Archive Tasks Job] Starting auto-archive process...');

  try {
    // Calculate threshold: 24 hours ago from now
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 24);

    console.info(
      `[Archive Tasks Job] Archiving tasks completed before: ${threshold.toISOString()}`
    );

    // Query: Find all completed tasks older than 24 hours that haven't been archived
    const tasksToArchive = await prisma.task.findMany({
      where: {
        status: 'completada',
        completedAt: {
          lt: threshold,
        },
        archivedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        completedAt: true,
        userId: true,
      },
    });

    console.info(`[Archive Tasks Job] Found ${tasksToArchive.length} tasks to archive`);

    const archivedTasks: ArchiveResult[] = [];
    const now = new Date();

    // Process each task
    for (const task of tasksToArchive) {
      try {
        // Update the task to set archivedAt
        await prisma.task.update({
          where: { id: task.id },
          data: { archivedAt: now },
        });

        // Log successful archive
        archivedTasks.push({
          taskId: task.id,
          title: task.title,
          completedAt: task.completedAt!,
          userId: task.userId,
        });

        console.info(
          `[Archive Tasks Job] ✓ Archived: "${task.title}" (completed: ${task.completedAt?.toISOString()})`
        );
      } catch (error) {
        // Continue processing other tasks even if one fails
        console.error(`[Archive Tasks Job] ✗ Error archiving task ${task.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.info(
      `[Archive Tasks Job] Completed in ${duration}ms. Archived ${archivedTasks.length} tasks.`
    );

    return archivedTasks;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Archive Tasks Job] Failed after ${duration}ms:`, error);
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
export function scheduleArchiveTasksJob(): cron.ScheduledTask {
  console.info('[Archive Tasks Job] Scheduling daily job at 00:01...');

  const task = cron.schedule('1 0 * * *', async () => {
    console.info('[Archive Tasks Job] Running scheduled task...');
    try {
      const results = await autoArchiveCompletedTasks();

      // Log summary
      if (results.length > 0) {
        console.info('[Archive Tasks Job] Summary:');
        results.forEach((result) => {
          console.info(
            `  - "${result.title}" completed on ${result.completedAt.toISOString().split('T')[0]}`
          );
        });
      } else {
        console.info('[Archive Tasks Job] No tasks needed archiving.');
      }
    } catch (error) {
      console.error('[Archive Tasks Job] Scheduled task failed:', error);
    }
  });

  console.info('[Archive Tasks Job] Scheduled successfully.');
  return task;
}

/**
 * Export for manual testing
 * Can be called directly for testing purposes
 */
export default {
  autoArchiveCompletedTasks,
  scheduleArchiveTasksJob,
};
