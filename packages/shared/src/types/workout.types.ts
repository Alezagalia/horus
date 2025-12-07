/**
 * Workout Types
 * Sprint 14 - US-128, US-129, US-130
 */

import type { MuscleGroup } from './exercise.types.js';

export interface Workout {
  id: string;
  userId: string;
  routineId: string | null;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  weightUnit: string;
  rpe: number | null;
  notes: string | null;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  notes: string | null;
  rpe: number | null;
}

export interface SetData {
  setNumber: number;
  reps: number;
  weight: number;
}

export interface LastWorkoutData {
  date: string;
  lastReps: number;
  lastWeight: number;
  lastWeightUnit: string;
  avgReps: number;
  avgWeight: number;
  maxWeight: number;
  totalSets: number;
  allSets: SetData[];
}

export interface ExerciseWithHistory {
  workoutExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup | null;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  restTime: number | null;
  notes: string | null;
  lastWorkoutData: LastWorkoutData | null;
  sets: WorkoutSet[];
}

export interface StartWorkoutResponse {
  workout: {
    id: string;
    routineId: string | null;
    routineName: string | null;
    startTime: string;
    endTime: string | null;
  };
  exercises: ExerciseWithHistory[];
}

export interface ActiveWorkoutError {
  workoutId: string;
  startTime: string;
  message: string;
}

// US-130 Types

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

export interface FinishWorkoutResponse {
  workout: {
    id: string;
    routineId: string | null;
    startTime: string;
    endTime: string;
    duration: number;
    notes: string | null;
  };
  summary: WorkoutSummary;
}

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
  muscleGroup: MuscleGroup | null;
  order: number;
  rpe: number | null;
  notes: string | null;
  sets: WorkoutSetDetailed[];
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

export interface WorkoutListItem {
  id: string;
  routineId: string | null;
  routineName: string | null;
  startTime: string;
  duration: number | null;
  exercisesCompleted: number;
  totalSets: number;
  totalVolume: number;
}

export interface WorkoutListResponse {
  workouts: WorkoutListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// US-131 Stats Types

export interface ExerciseStatsResponse {
  exercise: {
    id: string;
    name: string;
    muscleGroup: MuscleGroup | null;
  };
  period: {
    from: string;
    to: string;
    days: number;
  };
  executions: {
    timesExecuted: number;
    totalSets: number;
    totalReps: number;
  };
  loadProgress: {
    maxWeightAllTime: number;
    maxWeightPeriod: number;
    avgWeightPeriod: number;
    firstExecutionWeight: number;
    lastExecutionWeight: number;
    improvement: number;
    improvementPercentage: number;
  };
  volume: {
    totalVolume: number;
    avgVolumePerSession: number;
  };
  chart: Array<{
    date: string;
    maxWeight: number;
    totalVolume: number;
    totalSets: number;
  }>;
  lastWorkout: {
    date: string;
    sets: Array<{
      reps: number;
      weight: number;
    }>;
    rpe: number | null;
    notes: string | null;
  } | null;
}

export interface OverviewStatsResponse {
  period: {
    from: string;
    to: string;
    days: number;
  };
  workouts: {
    completed: number;
    frequency: number;
    avgDuration: number;
  };
  volume: {
    total: number;
    avgPerWorkout: number;
  };
  exercises: {
    uniqueExercises: number;
    totalSets: number;
  };
  topExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    count: number;
    totalVolume: number;
  }>;
  muscleGroupDistribution: Array<{
    muscleGroup: string;
    count: number;
    percentage: number;
  }>;
  weeklyFrequency: Array<{
    week: string;
    workouts: number;
    totalVolume: number;
  }>;
}
