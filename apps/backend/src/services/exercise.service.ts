/**
 * Exercise Service
 * Sprint 14 - US-126
 */

import { prisma } from '../lib/prisma.js';
import { MuscleGroup } from '../generated/prisma/client.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../middlewares/error.middleware.js';

export interface CreateExerciseData {
  name: string;
  muscleGroup?: MuscleGroup | null;
  notes?: string | null;
}

export interface UpdateExerciseData {
  name?: string;
  muscleGroup?: MuscleGroup | null;
  notes?: string | null;
}

export interface ExerciseFilters {
  muscleGroup?: MuscleGroup;
  search?: string;
}

export const exerciseService = {
  /**
   * List all exercises for a user with optional filters
   */
  async findAll(userId: string, filters?: ExerciseFilters) {
    const where: {
      userId: string;
      muscleGroup?: MuscleGroup;
      name?: { contains: string; mode: 'insensitive' };
    } = {
      userId,
    };

    if (filters?.muscleGroup) {
      where.muscleGroup = filters.muscleGroup;
    }

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            routineExercises: true,
            workoutExercises: true,
          },
        },
      },
    });

    // Get last used date for each exercise
    const exercisesWithStats = await Promise.all(
      exercises.map(async (exercise) => {
        const lastWorkoutExercise = await prisma.workoutExercise.findFirst({
          where: { exerciseId: exercise.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        return {
          ...exercise,
          usedInRoutines: exercise._count.routineExercises,
          usedInWorkouts: exercise._count.workoutExercises,
          lastUsed: lastWorkoutExercise?.createdAt.toISOString() || null,
          _count: undefined,
        };
      })
    );

    return exercisesWithStats;
  },

  /**
   * Get exercise by ID with detailed stats
   */
  async findById(id: string, userId: string) {
    const exercise = await prisma.exercise.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            routineExercises: true,
            workoutExercises: true,
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    if (exercise.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this exercise');
    }

    // Get last execution details
    const lastExecution = await prisma.workoutExercise.findFirst({
      where: { exerciseId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        workoutSets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    });

    // Get personal record (max weight)
    const personalRecord = await prisma.workoutSet.findFirst({
      where: {
        workoutExercise: {
          exerciseId: id,
        },
        completed: true,
      },
      orderBy: { weight: 'desc' },
      include: {
        workoutExercise: {
          select: { createdAt: true },
        },
      },
    });

    return {
      ...exercise,
      usedInRoutines: exercise._count.routineExercises,
      usedInWorkouts: exercise._count.workoutExercises,
      lastExecution: lastExecution
        ? {
            date: lastExecution.createdAt.toISOString(),
            sets: lastExecution.workoutSets.length,
            maxWeight: Math.max(...lastExecution.workoutSets.map((s) => Number(s.weight))),
            weightUnit: lastExecution.workoutSets[0]?.weightUnit || 'kg',
          }
        : null,
      personalRecord: personalRecord
        ? {
            weight: Number(personalRecord.weight),
            weightUnit: personalRecord.weightUnit,
            reps: personalRecord.reps,
            date: personalRecord.workoutExercise.createdAt.toISOString(),
          }
        : null,
      _count: undefined,
    };
  },

  /**
   * Create new exercise
   */
  async create(userId: string, data: CreateExerciseData) {
    // Check if exercise with same name already exists for this user
    const existing = await prisma.exercise.findFirst({
      where: {
        userId,
        name: data.name,
      },
    });

    if (existing) {
      throw new ConflictError(`Exercise with name "${data.name}" already exists`);
    }

    return prisma.exercise.create({
      data: {
        userId,
        name: data.name,
        muscleGroup: data.muscleGroup || null,
        notes: data.notes || null,
      },
    });
  },

  /**
   * Update exercise
   */
  async update(id: string, userId: string, data: UpdateExerciseData) {
    const exercise = await prisma.exercise.findFirst({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    if (exercise.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this exercise');
    }

    // If name is being changed, check for duplicates
    if (data.name && data.name !== exercise.name) {
      const existing = await prisma.exercise.findFirst({
        where: {
          userId,
          name: data.name,
        },
      });

      if (existing) {
        throw new ConflictError(`Exercise with name "${data.name}" already exists`);
      }
    }

    return prisma.exercise.update({
      where: { id },
      data: {
        name: data.name,
        muscleGroup: data.muscleGroup !== undefined ? data.muscleGroup : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      },
    });
  },

  /**
   * Delete exercise (with usage validation)
   */
  async delete(id: string, userId: string) {
    const exercise = await prisma.exercise.findFirst({
      where: { id },
      include: {
        routineExercises: {
          include: {
            routine: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    if (exercise.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this exercise');
    }

    // Check if exercise is used in any routines
    if (exercise.routineExercises.length > 0) {
      const routines = exercise.routineExercises.map((re) => ({
        id: re.routine.id,
        name: re.routine.name,
      }));

      throw new ConflictError(
        `Cannot delete exercise. It is used in ${routines.length} routine(s). Remove it from routines first.`,
        {
          routineCount: routines.length,
          routines,
        }
      );
    }

    // Note: If exercise is in workout history, it will be restricted by DB constraint (onDelete: Restrict)
    // This is intentional to preserve workout history integrity
    await prisma.exercise.delete({
      where: { id },
    });
  },
};
