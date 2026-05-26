import { axiosInstance } from '../axios';

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

export interface StartedWorkout {
  workout: { id: string; routineId: string; startTime: string };
  exercises: Array<{
    workoutExerciseId: string;
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    order: number;
    targetSets: number | null;
    targetReps: number | null;
    targetWeight: number | null;
    sets: unknown[];
  }>;
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const workoutApi = {
  listRoutines: async (): Promise<Routine[]> => {
    const { data } = await axiosInstance.get('/routines');
    return data.routines ?? data;
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
};
