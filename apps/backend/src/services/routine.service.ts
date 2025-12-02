/**
 * Routine Service
 * Sprint 14 - US-127
 */

import { prisma } from '../lib/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middlewares/error.middleware.js';
import type { CreateRoutineInput, UpdateRoutineInput } from '@horus/shared';

export const routineService = {
  /**
   * List all routines for a user with stats
   */
  async findAll(userId: string) {
    const routines = await prisma.routine.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            routineExercises: true,
            workouts: true,
          },
        },
        workouts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      description: routine.description,
      exerciseCount: routine._count.routineExercises,
      lastExecuted: routine.workouts[0]?.createdAt.toISOString() ?? null,
      timesExecuted: routine._count.workouts,
      createdAt: routine.createdAt.toISOString(),
    }));
  },

  /**
   * Get routine by ID with full details
   */
  async findById(id: string, userId: string) {
    const routine = await prisma.routine.findFirst({
      where: { id },
      include: {
        routineExercises: {
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroup: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            workouts: true,
          },
        },
        workouts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    if (routine.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this routine');
    }

    // Calculate stats
    const timesExecuted = routine._count.workouts;
    const lastExecuted =
      routine.workouts.length > 0 ? routine.workouts[0].createdAt.toISOString() : null;

    // For avgDuration, we would need to query all workouts
    // For now, set to null (can be implemented if needed)
    const avgDuration: number | null = null;

    return {
      id: routine.id,
      name: routine.name,
      description: routine.description,
      createdAt: routine.createdAt.toISOString(),
      updatedAt: routine.updatedAt.toISOString(),
      exercises: routine.routineExercises.map((re) => ({
        id: re.id,
        exerciseId: re.exerciseId,
        exerciseName: re.exercise.name,
        muscleGroup: re.exercise.muscleGroup,
        order: re.order,
        targetSets: re.targetSets,
        targetReps: re.targetReps,
        targetWeight: re.targetWeight,
        restTime: re.restTime,
        notes: re.notes,
      })),
      stats: {
        timesExecuted,
        lastExecuted,
        avgDuration,
      },
    };
  },

  /**
   * Create a new routine with exercises (atomic transaction)
   */
  async create(userId: string, data: CreateRoutineInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate that all exercises exist and belong to user
      const exerciseIds = data.exercises.map((e: { exerciseId: string }) => e.exerciseId);
      const exercises = await tx.exercise.findMany({
        where: {
          id: { in: exerciseIds },
          userId,
        },
      });

      if (exercises.length !== exerciseIds.length) {
        const foundIds = exercises.map((e: { id: string }) => e.id);
        const missingIds = exerciseIds.filter((id: string) => !foundIds.includes(id));

        throw new BadRequestError(
          `Some exercises not found or don't belong to user: ${missingIds.join(', ')}`
        );
      }

      // 2. Create routine
      const routine = await tx.routine.create({
        data: {
          userId,
          name: data.name,
          description: data.description ?? null,
        },
      });

      // 3. Create routine exercises
      await tx.routineExercise.createMany({
        data: data.exercises.map(
          (e: {
            exerciseId: string;
            order: number;
            targetSets?: number | null;
            targetReps?: number | null;
            targetWeight?: number | null;
            restTime?: number | null;
            notes?: string | null;
          }) => ({
            routineId: routine.id,
            exerciseId: e.exerciseId,
            order: e.order,
            targetSets: e.targetSets ?? null,
            targetReps: e.targetReps ?? null,
            targetWeight: e.targetWeight ?? null,
            restTime: e.restTime ?? null,
            notes: e.notes ?? null,
          })
        ),
      });

      // 4. Return routine with exercises
      const createdRoutine = await tx.routine.findUnique({
        where: { id: routine.id },
        include: {
          routineExercises: {
            include: {
              exercise: {
                select: {
                  name: true,
                  muscleGroup: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!createdRoutine) {
        throw new Error('Failed to retrieve created routine');
      }

      return {
        id: createdRoutine.id,
        name: createdRoutine.name,
        description: createdRoutine.description,
        createdAt: createdRoutine.createdAt.toISOString(),
        updatedAt: createdRoutine.updatedAt.toISOString(),
        exercises: createdRoutine.routineExercises.map((re) => ({
          id: re.id,
          exerciseId: re.exerciseId,
          exerciseName: re.exercise.name,
          muscleGroup: re.exercise.muscleGroup,
          order: re.order,
          targetSets: re.targetSets,
          targetReps: re.targetReps,
          targetWeight: re.targetWeight,
          restTime: re.restTime,
          notes: re.notes,
        })),
      };
    });
  },

  /**
   * Update routine (delete and recreate exercises strategy)
   */
  async update(id: string, userId: string, data: UpdateRoutineInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check routine exists and belongs to user
      const routine = await tx.routine.findFirst({
        where: { id },
      });

      if (!routine) {
        throw new NotFoundError('Routine not found');
      }

      if (routine.userId !== userId) {
        throw new ForbiddenError('You do not have permission to update this routine');
      }

      // 2. If exercises are being updated, validate them
      if (data.exercises) {
        const exerciseIds = data.exercises.map((e: { exerciseId: string }) => e.exerciseId);
        const exercises = await tx.exercise.findMany({
          where: {
            id: { in: exerciseIds },
            userId,
          },
        });

        if (exercises.length !== exerciseIds.length) {
          const foundIds = exercises.map((e: { id: string }) => e.id);
          const missingIds = exerciseIds.filter((id: string) => !foundIds.includes(id));

          throw new BadRequestError(
            `Some exercises not found or don't belong to user: ${missingIds.join(', ')}`
          );
        }

        // Delete all existing routine exercises
        await tx.routineExercise.deleteMany({
          where: { routineId: id },
        });

        // Create new routine exercises
        await tx.routineExercise.createMany({
          data: data.exercises.map(
            (e: {
              exerciseId: string;
              order: number;
              targetSets?: number | null;
              targetReps?: number | null;
              targetWeight?: number | null;
              restTime?: number | null;
              notes?: string | null;
            }) => ({
              routineId: id,
              exerciseId: e.exerciseId,
              order: e.order,
              targetSets: e.targetSets ?? null,
              targetReps: e.targetReps ?? null,
              targetWeight: e.targetWeight ?? null,
              restTime: e.restTime ?? null,
              notes: e.notes ?? null,
            })
          ),
        });
      }

      // 3. Update routine metadata
      const updatedRoutine = await tx.routine.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description ?? undefined,
        },
        include: {
          routineExercises: {
            include: {
              exercise: {
                select: {
                  name: true,
                  muscleGroup: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        id: updatedRoutine.id,
        name: updatedRoutine.name,
        description: updatedRoutine.description,
        createdAt: updatedRoutine.createdAt.toISOString(),
        updatedAt: updatedRoutine.updatedAt.toISOString(),
        exercises: updatedRoutine.routineExercises.map((re) => ({
          id: re.id,
          exerciseId: re.exerciseId,
          exerciseName: re.exercise.name,
          muscleGroup: re.exercise.muscleGroup,
          order: re.order,
          targetSets: re.targetSets,
          targetReps: re.targetReps,
          targetWeight: re.targetWeight,
          restTime: re.restTime,
          notes: re.notes,
        })),
      };
    });
  },

  /**
   * Delete routine
   */
  async delete(id: string, userId: string) {
    const routine = await prisma.routine.findFirst({
      where: { id },
    });

    if (!routine) {
      throw new NotFoundError('Routine not found');
    }

    if (routine.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this routine');
    }

    // Delete routine (cascade will delete routineExercises)
    // Workouts will have routineId set to null (SetNull in schema)
    await prisma.routine.delete({
      where: { id },
    });
  },
};
