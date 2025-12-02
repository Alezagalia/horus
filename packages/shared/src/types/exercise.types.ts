/**
 * Exercise Types
 * Sprint 14 - US-126
 */

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'piernas'
  | 'hombros'
  | 'brazos'
  | 'core'
  | 'cardio'
  | 'otro';

export interface Exercise {
  id: string;
  userId: string;
  name: string;
  muscleGroup: MuscleGroup | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseDTO {
  name: string;
  muscleGroup?: MuscleGroup | null;
  notes?: string | null;
}

export interface UpdateExerciseDTO {
  name?: string;
  muscleGroup?: MuscleGroup | null;
  notes?: string | null;
}

export interface ExerciseFilters {
  muscleGroup?: MuscleGroup;
  search?: string;
}

export interface ExerciseWithStats extends Exercise {
  usedInRoutines: number;
  usedInWorkouts: number;
  lastUsed: string | null;
}

export interface ExerciseDetail extends Exercise {
  usedInRoutines: number;
  usedInWorkouts: number;
  lastExecution: {
    date: string;
    sets: number;
    maxWeight: number;
    weightUnit: string;
  } | null;
  personalRecord: {
    weight: number;
    weightUnit: string;
    reps: number;
    date: string;
  } | null;
}

export interface ExercisesResponse {
  exercises: ExerciseWithStats[];
}
