/**
 * Workout Service
 * Sprint 14 - US-128, US-129, US-130
 */

import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';
import type {
  LastWorkoutData,
  AddSetInput,
  UpdateSetInput,
  UpdateWorkoutExerciseInput,
  FinishWorkoutInput,
  ListWorkoutsQuery,
  PersonalRecord,
  WorkoutSummary,
} from '@horus/shared';

/**
 * Helper: Calculate average of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc: number, val: number) => acc + val, 0);
  return Math.round((sum / numbers.length) * 10) / 10; // 1 decimal
}

/**
 * Helper: Get maximum value from array
 */
function max(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
}

export const workoutService = {
  /**
   * Start a new workout session from a routine
   * - Validates no active workout exists
   * - Creates Workout and WorkoutExercises
   * - Fetches last workout history for each exercise
   * - Returns workout with historical data pre-loaded
   */
  async startWorkout(userId: string, routineId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if user has an active workout
      const activeWorkout = await tx.workout.findFirst({
        where: {
          userId,
          endTime: null, // Not finished
        },
        select: {
          id: true,
          startTime: true,
        },
      });

      if (activeWorkout) {
        throw new ConflictError(
          `Ya tienes un entrenamiento en progreso iniciado a las ${activeWorkout.startTime.toISOString()}. Finalízalo o cancélalo primero.`,
          {
            workoutId: activeWorkout.id,
            startTime: activeWorkout.startTime.toISOString(),
          }
        );
      }

      // 2. Validate routine exists and belongs to user
      const routine = await tx.routine.findFirst({
        where: {
          id: routineId,
          userId,
        },
        include: {
          routineExercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  muscleGroup: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!routine) {
        throw new NotFoundError('Routine not found or does not belong to you');
      }

      // 3. Create new Workout
      const workout = await tx.workout.create({
        data: {
          userId,
          routineId,
          startTime: new Date(),
          endTime: null,
          notes: null,
        },
      });

      // 4. Create WorkoutExercise for each RoutineExercise
      await tx.workoutExercise.createMany({
        data: routine.routineExercises.map((re: { exerciseId: string; order: number }) => ({
          workoutId: workout.id,
          exerciseId: re.exerciseId,
          order: re.order,
          notes: null,
          rpe: null,
        })),
      });

      // 5. Fetch last completed workout for this routine (exclude current one)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const lastWorkout = await tx.workout.findFirst({
        where: {
          userId,
          routineId,
          endTime: { not: null }, // Only completed workouts
          id: { not: workout.id }, // Exclude the one we just created
          startTime: { gte: ninetyDaysAgo }, // Last 90 days for performance
        },
        orderBy: {
          startTime: 'desc',
        },
        select: {
          id: true,
          startTime: true,
          workoutExercises: {
            select: {
              exerciseId: true,
              workoutSets: {
                select: {
                  setNumber: true,
                  reps: true,
                  weight: true,
                  weightUnit: true,
                },
                orderBy: {
                  setNumber: 'asc',
                },
              },
            },
          },
        },
      });

      // 6. Build exercise list with historical data
      const exercisesWithHistory = routine.routineExercises.map((re) => {
        // Note: workoutExerciseId will be filled later after querying created WorkoutExercises

        // Find historical data for this exercise
        let lastWorkoutData: LastWorkoutData | null = null;

        if (lastWorkout) {
          const lastExercise = lastWorkout.workoutExercises.find(
            (we: { exerciseId: string }) => we.exerciseId === re.exerciseId
          );

          if (lastExercise && lastExercise.workoutSets.length > 0) {
            const sets = lastExercise.workoutSets;

            // Calculate statistics
            const repsArray = sets.map((s: any) => s.reps);
            const weightsArray = sets.map((s: any) => Number(s.weight));

            const lastSet = sets[sets.length - 1];

            lastWorkoutData = {
              date: lastWorkout.startTime.toISOString(),
              lastReps: lastSet.reps,
              lastWeight: Number(lastSet.weight),
              lastWeightUnit: lastSet.weightUnit,
              avgReps: average(repsArray),
              avgWeight: average(weightsArray),
              maxWeight: max(weightsArray),
              totalSets: sets.length,
              allSets: sets.map((s: any) => ({
                setNumber: s.setNumber,
                reps: s.reps,
                weight: Number(s.weight),
              })),
            };
          }
        }

        return {
          workoutExerciseId: '', // Will be filled after query
          exerciseId: re.exerciseId,
          exerciseName: re.exercise.name,
          muscleGroup: re.exercise.muscleGroup,
          order: re.order,
          targetSets: re.targetSets,
          targetReps: re.targetReps,
          targetWeight: re.targetWeight ? Number(re.targetWeight) : null,
          restTime: re.restTime,
          notes: re.notes,
          lastWorkoutData,
          sets: [],
        };
      });

      // 7. Fetch created WorkoutExercises to get their IDs
      const createdWorkoutExercises = await tx.workoutExercise.findMany({
        where: {
          workoutId: workout.id,
        },
        select: {
          id: true,
          exerciseId: true,
          order: true,
        },
      });

      // 8. Map workoutExerciseIds to exercises
      const exercisesWithIds = exercisesWithHistory.map((ex) => {
        const we = createdWorkoutExercises.find((cwe) => cwe.exerciseId === ex.exerciseId);
        return {
          ...ex,
          workoutExerciseId: we?.id || '',
        };
      });

      return {
        workout: {
          id: workout.id,
          routineId: routine.id,
          routineName: routine.name,
          startTime: workout.startTime.toISOString(),
          endTime: null,
        },
        exercises: exercisesWithIds,
      };
    });
  },

  /**
   * Add a set to a workout exercise
   * - Validates workout is active and belongs to user
   * - Auto-calculates setNumber
   * - Creates WorkoutSet with timestamp
   */
  async addSet(userId: string, workoutId: string, workoutExerciseId: string, data: AddSetInput) {
    // 1. Validate workout exists, belongs to user, and is not finished
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    if (workout.endTime !== null) {
      throw new ForbiddenError('Cannot add sets to a finished workout');
    }

    // 2. Validate workout exercise belongs to this workout
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: workoutExerciseId,
        workoutId,
      },
    });

    if (!workoutExercise) {
      throw new NotFoundError('Workout exercise not found in this workout');
    }

    // 3. Calculate setNumber (auto-increment)
    const existingSetsCount = await prisma.workoutSet.count({
      where: { workoutExerciseId },
    });

    const setNumber = existingSetsCount + 1;

    // 4. Create set
    const set = await prisma.workoutSet.create({
      data: {
        workoutExerciseId,
        setNumber,
        reps: data.reps,
        weight: data.weight,
        weightUnit: data.weightUnit,
        completed: data.completed ?? true,
        restTime: data.restTime ?? null,
        notes: data.notes ?? null,
      },
    });

    return {
      id: set.id,
      workoutExerciseId: set.workoutExerciseId,
      setNumber: set.setNumber,
      reps: set.reps,
      weight: Number(set.weight),
      weightUnit: set.weightUnit,
      completed: set.completed,
      restTime: set.restTime,
      notes: set.notes,
      timestamp: set.timestamp.toISOString(),
    };
  },

  /**
   * Update a set
   * - Only if workout is not finished
   */
  async updateSet(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
    data: UpdateSetInput
  ) {
    // 1. Validate workout
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    if (workout.endTime !== null) {
      throw new ForbiddenError('Cannot edit sets in a finished workout');
    }

    // 2. Validate set belongs to workout exercise
    const set = await prisma.workoutSet.findFirst({
      where: {
        id: setId,
        workoutExerciseId,
      },
    });

    if (!set) {
      throw new NotFoundError('Set not found');
    }

    // 3. Update set
    const updatedSet = await prisma.workoutSet.update({
      where: { id: setId },
      data: {
        reps: data.reps,
        weight: data.weight,
        weightUnit: data.weightUnit,
        completed: data.completed,
        restTime: data.restTime ?? undefined,
        notes: data.notes ?? undefined,
      },
    });

    return {
      id: updatedSet.id,
      workoutExerciseId: updatedSet.workoutExerciseId,
      setNumber: updatedSet.setNumber,
      reps: updatedSet.reps,
      weight: Number(updatedSet.weight),
      weightUnit: updatedSet.weightUnit,
      completed: updatedSet.completed,
      restTime: updatedSet.restTime,
      notes: updatedSet.notes,
      timestamp: updatedSet.timestamp.toISOString(),
    };
  },

  /**
   * Delete a set and recalculate setNumbers
   * - Only if workout is not finished
   * - Recalculates setNumber for all subsequent sets
   */
  async deleteSet(userId: string, workoutId: string, workoutExerciseId: string, setId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate workout
      const workout = await tx.workout.findFirst({
        where: { id: workoutId, userId },
      });

      if (!workout) {
        throw new NotFoundError('Workout not found');
      }

      if (workout.endTime !== null) {
        throw new ForbiddenError('Cannot delete sets from a finished workout');
      }

      // 2. Get set to delete
      const setToDelete = await tx.workoutSet.findFirst({
        where: {
          id: setId,
          workoutExerciseId,
        },
      });

      if (!setToDelete) {
        throw new NotFoundError('Set not found');
      }

      // 3. Delete the set
      await tx.workoutSet.delete({
        where: { id: setId },
      });

      // 4. Recalculate setNumbers for sets with higher numbers
      const setsToUpdate = await tx.workoutSet.findMany({
        where: {
          workoutExerciseId,
          setNumber: { gt: setToDelete.setNumber },
        },
        orderBy: { setNumber: 'asc' },
      });

      // Update each set's setNumber (decrement by 1)
      for (const set of setsToUpdate) {
        await tx.workoutSet.update({
          where: { id: set.id },
          data: { setNumber: set.setNumber - 1 },
        });
      }
    });
  },

  /**
   * Update workout exercise metadata (RPE, notes)
   */
  async updateWorkoutExercise(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    data: UpdateWorkoutExerciseInput
  ) {
    // 1. Validate workout
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    if (workout.endTime !== null) {
      throw new ForbiddenError('Cannot edit a finished workout');
    }

    // 2. Validate workout exercise
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: workoutExerciseId,
        workoutId,
      },
    });

    if (!workoutExercise) {
      throw new NotFoundError('Workout exercise not found');
    }

    // 3. Update
    const updated = await prisma.workoutExercise.update({
      where: { id: workoutExerciseId },
      data: {
        rpe: data.rpe ?? undefined,
        notes: data.notes ?? undefined,
      },
    });

    return {
      id: updated.id,
      rpe: updated.rpe,
      notes: updated.notes,
    };
  },

  /**
   * Finish workout and calculate summary statistics
   * - Updates endTime
   * - Calculates duration, volume, PRs
   * - Returns comprehensive summary
   */
  async finishWorkout(userId: string, workoutId: string, data: FinishWorkoutInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate workout exists, belongs to user, not finished
      const workout = await tx.workout.findFirst({
        where: { id: workoutId, userId },
        include: {
          routine: {
            select: { name: true },
          },
        },
      });

      if (!workout) {
        throw new NotFoundError('Workout not found');
      }

      if (workout.endTime !== null) {
        throw new ForbiddenError('Workout is already finished');
      }

      // 2. Update workout with endTime
      const endTime = new Date();
      const updatedWorkout = await tx.workout.update({
        where: { id: workoutId },
        data: {
          endTime,
          notes: data.notes ?? undefined,
        },
      });

      // 3. Calculate duration in minutes
      const durationMs = endTime.getTime() - workout.startTime.getTime();
      const duration = Math.round(durationMs / 60000);

      // 4. Fetch all workout exercises with sets
      const workoutExercises = await tx.workoutExercise.findMany({
        where: { workoutId },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
            },
          },
          workoutSets: {
            select: {
              reps: true,
              weight: true,
            },
          },
        },
      });

      // 5. Calculate summary statistics
      let totalSets = 0;
      let totalReps = 0;
      let totalVolume = 0;

      for (const we of workoutExercises) {
        totalSets += we.workoutSets.length;
        for (const set of we.workoutSets) {
          totalReps += set.reps;
          totalVolume += set.reps * Number(set.weight);
        }
      }

      const avgWeight = totalReps > 0 ? Math.round((totalVolume / totalReps) * 10) / 10 : 0;

      // 6. Detect Personal Records
      const personalRecords: PersonalRecord[] = [];

      for (const we of workoutExercises) {
        if (we.workoutSets.length === 0) continue;

        // Get max weight from this workout
        const maxWeight = Math.max(...we.workoutSets.map((s) => Number(s.weight)));

        // Query historical max for this exercise (exclude current workout)
        const historicalSets = await tx.workoutSet.findMany({
          where: {
            workoutExercise: {
              exerciseId: we.exerciseId,
              workout: {
                userId,
                endTime: { not: null },
                id: { not: workoutId },
              },
            },
          },
          select: {
            weight: true,
          },
        });

        if (historicalSets.length === 0) {
          // First time doing this exercise = PR
          personalRecords.push({
            exerciseId: we.exerciseId,
            exerciseName: we.exercise.name,
            newPR: maxWeight,
            previousPR: 0,
            improvement: maxWeight,
          });
        } else {
          const previousPR = Math.max(...historicalSets.map((s) => Number(s.weight)));
          if (maxWeight > previousPR) {
            personalRecords.push({
              exerciseId: we.exerciseId,
              exerciseName: we.exercise.name,
              newPR: maxWeight,
              previousPR,
              improvement: Math.round((maxWeight - previousPR) * 10) / 10,
            });
          }
        }
      }

      // 7. Build summary
      const summary: WorkoutSummary = {
        exercisesCompleted: workoutExercises.length,
        totalSets,
        totalReps,
        totalVolume: Math.round(totalVolume * 10) / 10,
        avgWeight,
        personalRecords,
      };

      return {
        workout: {
          id: updatedWorkout.id,
          routineId: updatedWorkout.routineId,
          startTime: updatedWorkout.startTime.toISOString(),
          endTime: updatedWorkout.endTime!.toISOString(),
          duration,
          notes: updatedWorkout.notes,
        },
        summary,
      };
    });
  },

  /**
   * Get workout by ID with full details
   */
  async getWorkoutById(userId: string, workoutId: string) {
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
      include: {
        routine: {
          select: { name: true },
        },
        workoutExercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                muscleGroup: true,
              },
            },
            workoutSets: {
              select: {
                setNumber: true,
                reps: true,
                weight: true,
                weightUnit: true,
                completed: true,
                restTime: true,
                timestamp: true,
              },
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    // Calculate duration if finished
    let duration: number | null = null;
    if (workout.endTime) {
      const durationMs = workout.endTime.getTime() - workout.startTime.getTime();
      duration = Math.round(durationMs / 60000);
    }

    // Calculate summary if finished
    let summary: WorkoutSummary | null = null;
    if (workout.endTime) {
      let totalSets = 0;
      let totalReps = 0;
      let totalVolume = 0;

      for (const we of workout.workoutExercises) {
        totalSets += we.workoutSets.length;
        for (const set of we.workoutSets) {
          totalReps += set.reps;
          totalVolume += set.reps * Number(set.weight);
        }
      }

      const avgWeight = totalReps > 0 ? Math.round((totalVolume / totalReps) * 10) / 10 : 0;

      summary = {
        exercisesCompleted: workout.workoutExercises.length,
        totalSets,
        totalReps,
        totalVolume: Math.round(totalVolume * 10) / 10,
        avgWeight,
        personalRecords: [], // PRs only calculated on finish
      };
    }

    return {
      id: workout.id,
      routineId: workout.routineId,
      routineName: workout.routine?.name || null,
      startTime: workout.startTime.toISOString(),
      endTime: workout.endTime?.toISOString() || null,
      duration,
      notes: workout.notes,
      exercises: workout.workoutExercises.map((we) => ({
        id: we.id,
        exerciseId: we.exerciseId,
        exerciseName: we.exercise.name,
        muscleGroup: we.exercise.muscleGroup,
        order: we.order,
        rpe: we.rpe,
        notes: we.notes,
        sets: we.workoutSets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          weight: Number(s.weight),
          weightUnit: s.weightUnit,
          completed: s.completed,
          restTime: s.restTime,
          timestamp: s.timestamp.toISOString(),
        })),
      })),
      summary,
    };
  },

  /**
   * List workouts with filters and pagination
   */
  async listWorkouts(userId: string, query: ListWorkoutsQuery) {
    const { from, to, routineId, page = 1, limit = 20 } = query;

    // Build where clause
    const where: any = {
      userId,
      endTime: { not: null }, // Only finished workouts
    };

    if (from || to) {
      where.startTime = {};
      if (from) {
        where.startTime.gte = new Date(from + 'T00:00:00Z');
      }
      if (to) {
        where.startTime.lte = new Date(to + 'T23:59:59Z');
      }
    }

    if (routineId) {
      where.routineId = routineId;
    }

    // Get total count
    const total = await prisma.workout.count({ where });

    // Get paginated workouts
    const workouts = await prisma.workout.findMany({
      where,
      include: {
        routine: {
          select: { name: true },
        },
        workoutExercises: {
          include: {
            workoutSets: {
              select: {
                reps: true,
                weight: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stats for each workout
    const workoutList = workouts.map((workout) => {
      const durationMs = workout.endTime!.getTime() - workout.startTime.getTime();
      const duration = Math.round(durationMs / 60000);

      let totalSets = 0;
      let totalVolume = 0;

      for (const we of workout.workoutExercises) {
        totalSets += we.workoutSets.length;
        for (const set of we.workoutSets) {
          totalVolume += set.reps * Number(set.weight);
        }
      }

      return {
        id: workout.id,
        routineId: workout.routineId,
        routineName: workout.routine?.name || null,
        startTime: workout.startTime.toISOString(),
        duration,
        exercisesCompleted: workout.workoutExercises.length,
        totalSets,
        totalVolume: Math.round(totalVolume * 10) / 10,
      };
    });

    return {
      workouts: workoutList,
      pagination: {
        page,
        limit,
        total,
      },
    };
  },

  /**
   * Cancel a workout (delete it)
   * - Validates workout exists and belongs to user
   * - Only allows canceling unfinished workouts
   * - Deletes workout and all associated data (cascading)
   */
  async cancelWorkout(userId: string, workoutId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate workout exists, belongs to user, not finished
      const workout = await tx.workout.findFirst({
        where: { id: workoutId, userId },
      });

      if (!workout) {
        throw new NotFoundError('Workout not found');
      }

      if (workout.endTime !== null) {
        throw new ForbiddenError('Cannot cancel a finished workout');
      }

      // 2. Delete workout (cascade will delete workoutExercises and workoutSets)
      await tx.workout.delete({
        where: { id: workoutId },
      });
    });
  },
};
