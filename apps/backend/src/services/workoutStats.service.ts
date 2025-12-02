/**
 * Workout Stats Service
 * Sprint 14 - US-131
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../middlewares/error.middleware.js';
import type { ExerciseStatsResponse, OverviewStatsResponse } from '@horus/shared';

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Get week number (ISO week)
 */
function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export const workoutStatsService = {
  /**
   * Get exercise-specific statistics
   * - Load progression over time
   * - Volume analysis
   * - Chart data for graphs
   */
  async getExerciseStats(
    userId: string,
    exerciseId: string,
    days: number = 90
  ): Promise<ExerciseStatsResponse> {
    // 1. Verify exercise exists
    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId },
      select: {
        id: true,
        name: true,
        muscleGroup: true,
      },
    });

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // 2. Calculate period
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // 3. Get all workout sets for this exercise in period
    const workoutSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          exerciseId,
          workout: {
            userId,
            endTime: { not: null },
            startTime: { gte: fromDate },
          },
        },
      },
      include: {
        workoutExercise: {
          include: {
            workout: {
              select: {
                id: true,
                startTime: true,
              },
            },
            exercise: true,
          },
        },
      },
      orderBy: {
        workoutExercise: {
          workout: {
            startTime: 'asc',
          },
        },
      },
    });

    if (workoutSets.length === 0) {
      // No data for this exercise in period
      return {
        exercise,
        period: {
          from: formatDate(fromDate),
          to: formatDate(toDate),
          days,
        },
        executions: {
          timesExecuted: 0,
          totalSets: 0,
          totalReps: 0,
        },
        loadProgress: {
          maxWeightAllTime: 0,
          maxWeightPeriod: 0,
          avgWeightPeriod: 0,
          firstExecutionWeight: 0,
          lastExecutionWeight: 0,
          improvement: 0,
          improvementPercentage: 0,
        },
        volume: {
          totalVolume: 0,
          avgVolumePerSession: 0,
        },
        chart: [],
        lastWorkout: null,
      };
    }

    // 4. Group sets by workout
    const workoutMap = new Map<string, any[]>();
    for (const set of workoutSets) {
      const workoutId = set.workoutExercise.workout.id;
      if (!workoutMap.has(workoutId)) {
        workoutMap.set(workoutId, []);
      }
      workoutMap.get(workoutId)!.push(set);
    }

    // 5. Calculate executions stats
    const timesExecuted = workoutMap.size;
    const totalSets = workoutSets.length;
    const totalReps = workoutSets.reduce((sum, s) => sum + s.reps, 0);

    // 6. Calculate load progress
    const weights = workoutSets.map((s) => Number(s.weight));
    const maxWeightPeriod = Math.max(...weights);
    const avgWeightPeriod =
      Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10;

    // Get first and last execution
    const firstWorkout = Array.from(workoutMap.values())[0];
    const lastWorkout = Array.from(workoutMap.values())[timesExecuted - 1];

    const firstExecutionWeight = Math.max(...firstWorkout.map((s: any) => Number(s.weight)));
    const lastExecutionWeight = Math.max(...lastWorkout.map((s: any) => Number(s.weight)));
    const improvement = Math.round((lastExecutionWeight - firstExecutionWeight) * 10) / 10;
    const improvementPercentage =
      firstExecutionWeight > 0
        ? Math.round((improvement / firstExecutionWeight) * 100 * 10) / 10
        : 0;

    // Get all-time max
    const allTimeSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          exerciseId,
          workout: {
            userId,
            endTime: { not: null },
          },
        },
      },
      select: {
        weight: true,
      },
    });
    const maxWeightAllTime =
      allTimeSets.length > 0 ? Math.max(...allTimeSets.map((s) => Number(s.weight))) : 0;

    // 7. Calculate volume
    let totalVolume = 0;
    for (const set of workoutSets) {
      totalVolume += set.reps * Number(set.weight);
    }
    totalVolume = Math.round(totalVolume * 10) / 10;
    const avgVolumePerSession = Math.round((totalVolume / timesExecuted) * 10) / 10;

    // 8. Build chart data (group by date)
    const chartMap = new Map<
      string,
      { maxWeight: number; totalVolume: number; totalSets: number }
    >();
    for (const [workoutId, sets] of workoutMap.entries()) {
      const date = formatDate(sets[0].workoutExercise.workout.startTime);
      const maxWeight = Math.max(...sets.map((s: any) => Number(s.weight)));
      const volume = sets.reduce((sum: number, s: any) => sum + s.reps * Number(s.weight), 0);

      if (chartMap.has(date)) {
        const existing = chartMap.get(date)!;
        existing.maxWeight = Math.max(existing.maxWeight, maxWeight);
        existing.totalVolume += volume;
        existing.totalSets += sets.length;
      } else {
        chartMap.set(date, {
          maxWeight,
          totalVolume: Math.round(volume * 10) / 10,
          totalSets: sets.length,
        });
      }
    }

    const chart = Array.from(chartMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 9. Get last workout details
    const lastWorkoutSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          exerciseId,
          workout: {
            userId,
            endTime: { not: null },
          },
        },
      },
      include: {
        workoutExercise: {
          include: {
            workout: {
              select: {
                startTime: true,
              },
            },
          },
          select: {
            rpe: true,
            notes: true,
            workout: true,
          },
        },
      },
      orderBy: {
        workoutExercise: {
          workout: {
            startTime: 'desc',
          },
        },
      },
      take: 10,
    });

    const lastWorkoutData =
      lastWorkoutSets.length > 0
        ? {
            date: lastWorkoutSets[0].workoutExercise.workout.startTime.toISOString(),
            sets: lastWorkoutSets.map((s) => ({
              reps: s.reps,
              weight: Number(s.weight),
            })),
            rpe: lastWorkoutSets[0].workoutExercise.rpe,
            notes: lastWorkoutSets[0].workoutExercise.notes,
          }
        : null;

    return {
      exercise,
      period: {
        from: formatDate(fromDate),
        to: formatDate(toDate),
        days,
      },
      executions: {
        timesExecuted,
        totalSets,
        totalReps,
      },
      loadProgress: {
        maxWeightAllTime,
        maxWeightPeriod,
        avgWeightPeriod,
        firstExecutionWeight,
        lastExecutionWeight,
        improvement,
        improvementPercentage,
      },
      volume: {
        totalVolume,
        avgVolumePerSession,
      },
      chart,
      lastWorkout: lastWorkoutData,
    };
  },

  /**
   * Get overview statistics
   * - Workout frequency
   * - Volume trends
   * - Exercise distribution
   */
  async getOverviewStats(userId: string, days: number = 30): Promise<OverviewStatsResponse> {
    // 1. Calculate period
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // 2. Get workouts in period
    const workouts = await prisma.workout.findMany({
      where: {
        userId,
        endTime: { not: null },
        startTime: { gte: fromDate },
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            workoutSets: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const completed = workouts.length;
    if (completed === 0) {
      return {
        period: {
          from: formatDate(fromDate),
          to: formatDate(toDate),
          days,
        },
        workouts: {
          completed: 0,
          frequency: 0,
          avgDuration: 0,
        },
        volume: {
          total: 0,
          avgPerWorkout: 0,
        },
        exercises: {
          uniqueExercises: 0,
          totalSets: 0,
        },
        topExercises: [],
        muscleGroupDistribution: [],
        weeklyFrequency: [],
      };
    }

    // 3. Calculate workout stats
    const durationSum = workouts.reduce((sum, w) => {
      if (w.endTime) {
        const duration = (w.endTime.getTime() - w.startTime.getTime()) / 60000;
        return sum + duration;
      }
      return sum;
    }, 0);
    const avgDuration = Math.round(durationSum / completed);
    const frequency = Math.round((completed / days) * 7 * 10) / 10; // workouts per week

    // 4. Calculate volume
    let totalVolume = 0;
    let totalSets = 0;
    const exerciseCounts = new Map<string, { name: string; count: number; volume: number }>();
    const muscleGroupCounts = new Map<string, number>();

    for (const workout of workouts) {
      for (const we of workout.workoutExercises) {
        const exerciseId = we.exerciseId;
        const exerciseName = we.exercise.name;
        const muscleGroup = we.exercise.muscleGroup || 'Otro';

        for (const set of we.workoutSets) {
          const volume = set.reps * Number(set.weight);
          totalVolume += volume;
          totalSets++;

          // Track exercise
          if (exerciseCounts.has(exerciseId)) {
            const data = exerciseCounts.get(exerciseId)!;
            data.count++;
            data.volume += volume;
          } else {
            exerciseCounts.set(exerciseId, { name: exerciseName, count: 1, volume });
          }

          // Track muscle group
          muscleGroupCounts.set(muscleGroup, (muscleGroupCounts.get(muscleGroup) || 0) + 1);
        }
      }
    }

    totalVolume = Math.round(totalVolume * 10) / 10;
    const avgPerWorkout = Math.round((totalVolume / completed) * 10) / 10;

    // 5. Get unique exercises
    const uniqueExercises = exerciseCounts.size;

    // 6. Top exercises (sorted by count)
    const topExercises = Array.from(exerciseCounts.entries())
      .map(([id, data]) => ({
        exerciseId: id,
        exerciseName: data.name,
        count: data.count,
        totalVolume: Math.round(data.volume * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Muscle group distribution
    const muscleGroupDistribution = Array.from(muscleGroupCounts.entries())
      .map(([muscleGroup, count]) => ({
        muscleGroup,
        count,
        percentage: Math.round((count / totalSets) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);

    // 8. Weekly frequency
    const weeklyMap = new Map<string, { workouts: number; volume: number }>();
    for (const workout of workouts) {
      const week = getWeekNumber(workout.startTime);
      let workoutVolume = 0;
      for (const we of workout.workoutExercises) {
        for (const set of we.workoutSets) {
          workoutVolume += set.reps * Number(set.weight);
        }
      }

      if (weeklyMap.has(week)) {
        const data = weeklyMap.get(week)!;
        data.workouts++;
        data.volume += workoutVolume;
      } else {
        weeklyMap.set(week, { workouts: 1, volume: workoutVolume });
      }
    }

    const weeklyFrequency = Array.from(weeklyMap.entries())
      .map(([week, data]) => ({
        week,
        workouts: data.workouts,
        totalVolume: Math.round(data.volume * 10) / 10,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return {
      period: {
        from: formatDate(fromDate),
        to: formatDate(toDate),
        days,
      },
      workouts: {
        completed,
        frequency,
        avgDuration,
      },
      volume: {
        total: totalVolume,
        avgPerWorkout,
      },
      exercises: {
        uniqueExercises,
        totalSets,
      },
      topExercises,
      muscleGroupDistribution,
      weeklyFrequency,
    };
  },
};
