/**
 * Routine Types
 * Sprint 14 - US-127
 */

import type { MuscleGroup } from './exercise.types';

export interface Routine {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  restTime: number | null;
  notes: string | null;
}

export interface CreateRoutineExerciseDTO {
  exerciseId: string;
  order: number;
  targetSets?: number | null;
  targetReps?: number | null;
  targetWeight?: number | null;
  restTime?: number | null;
  notes?: string | null;
}

export interface CreateRoutineDTO {
  name: string;
  description?: string | null;
  exercises: CreateRoutineExerciseDTO[];
}

export interface UpdateRoutineDTO {
  name?: string;
  description?: string | null;
  exercises?: CreateRoutineExerciseDTO[];
}

export interface RoutineSummary {
  id: string;
  name: string;
  description: string | null;
  exerciseCount: number;
  lastExecuted: string | null;
  timesExecuted: number;
  createdAt: string;
}

export interface RoutineExerciseDetail extends RoutineExercise {
  exerciseName: string;
  muscleGroup: MuscleGroup | null;
}

export interface RoutineDetail extends Routine {
  exercises: RoutineExerciseDetail[];
  stats: {
    timesExecuted: number;
    lastExecuted: string | null;
    avgDuration: number | null;
  };
}

export interface RoutinesResponse {
  routines: RoutineSummary[];
}
