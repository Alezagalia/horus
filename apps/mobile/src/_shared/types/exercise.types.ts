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

// MuscleGroup enum for runtime access
export const MuscleGroup = {
  PECHO: 'pecho' as MuscleGroup,
  ESPALDA: 'espalda' as MuscleGroup,
  PIERNAS: 'piernas' as MuscleGroup,
  HOMBROS: 'hombros' as MuscleGroup,
  BRAZOS: 'brazos' as MuscleGroup,
  CORE: 'core' as MuscleGroup,
  ABDOMEN: 'core' as MuscleGroup, // Alias for compatibility
  CARDIO: 'cardio' as MuscleGroup,
  OTRO: 'otro' as MuscleGroup,
} as const;

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
