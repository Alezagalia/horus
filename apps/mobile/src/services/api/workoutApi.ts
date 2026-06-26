import { axiosInstance } from '../axios';
import type { CreateRoutineDTO, UpdateRoutineDTO, RoutineDetail } from '@horus/shared';

export type { CreateRoutineDTO, UpdateRoutineDTO, RoutineDetail };

// ─── Routine types ─────────────────────────────────────────────────────────────

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exerciseCount: number;
  lastExecuted: string | null;
  timesExecuted: number;
  createdAt: string;
}

// ─── Workout types ─────────────────────────────────────────────────────────────

export interface WorkoutSummaryItem {
  id: string;
  routineId: string;
  routineName: string | null;
  startTime: string;
  duration: number; // minutes
  exercisesCompleted: number;
  totalSets: number;
  totalVolume: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
  weightUnit: string;
  completed: boolean;
  notes: string | null;
  timestamp: string;
}

export interface AddSetDTO {
  reps: number;
  weight: number;
  weightUnit?: 'kg' | 'lbs';
  completed?: boolean;
  notes?: string | null;
}

export interface WorkoutExercise {
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  sets: WorkoutSet[];
}

export interface StartedWorkout {
  workout: { id: string; routineId: string; startTime: string };
  exercises: WorkoutExercise[];
}

// ─── Workout detail types ──────────────────────────────────────────────────────

export interface WorkoutSetDetailed {
  setNumber: number;
  reps: number;
  weight: number;
  weightUnit: string;
  completed: boolean;
  restTime: number | null;
  timestamp: string;
}

export interface WorkoutExerciseDetailed {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  order: number;
  rpe: number | null;
  notes: string | null;
  sets: WorkoutSetDetailed[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  newPR: number;
  previousPR: number;
  improvement: number;
}

export interface WorkoutSummary {
  exercisesCompleted: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  avgWeight: number;
  personalRecords: PersonalRecord[];
}

export interface WorkoutDetailResponse {
  id: string;
  routineId: string | null;
  routineName: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  notes: string | null;
  exercises: WorkoutExerciseDetailed[];
  summary: WorkoutSummary | null;
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const workoutApi = {
  listRoutines: async (): Promise<Routine[]> => {
    const { data } = await axiosInstance.get('/routines');
    return data.routines ?? data;
  },

  getRoutineById: async (id: string): Promise<RoutineDetail> => {
    const { data } = await axiosInstance.get(`/routines/${id}`);
    return data.routine ?? data;
  },

  createRoutine: async (dto: CreateRoutineDTO): Promise<RoutineDetail> => {
    const { data } = await axiosInstance.post('/routines', dto);
    return data.routine ?? data;
  },

  updateRoutine: async (id: string, dto: UpdateRoutineDTO): Promise<RoutineDetail> => {
    const { data } = await axiosInstance.put(`/routines/${id}`, dto);
    return data.routine ?? data;
  },

  deleteRoutine: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/routines/${id}`);
  },

  listWorkouts: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    workouts: WorkoutSummaryItem[];
    pagination: { page: number; limit: number; total: number };
  }> => {
    const { data } = await axiosInstance.get('/workouts', { params });
    return data;
  },

  startWorkout: async (routineId: string): Promise<StartedWorkout> => {
    const { data } = await axiosInstance.post(`/routines/${routineId}/start`);
    return data;
  },

  finishWorkout: async (workoutId: string): Promise<void> => {
    await axiosInstance.put(`/workouts/${workoutId}/finish`, {});
  },

  cancelWorkout: async (workoutId: string): Promise<void> => {
    await axiosInstance.delete(`/workouts/${workoutId}/cancel`);
  },

  addSet: async (
    workoutId: string,
    workoutExerciseId: string,
    dto: AddSetDTO
  ): Promise<WorkoutSet> => {
    const { data } = await axiosInstance.post(
      `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
      dto
    );
    return data.set ?? data;
  },

  deleteSet: async (workoutId: string, workoutExerciseId: string, setId: string): Promise<void> => {
    await axiosInstance.delete(
      `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`
    );
  },

  getWorkoutById: async (id: string): Promise<WorkoutDetailResponse> => {
    const { data } = await axiosInstance.get(`/workouts/${id}`);
    return data;
  },
};
