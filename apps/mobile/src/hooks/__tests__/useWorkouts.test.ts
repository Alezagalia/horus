import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Offline-first Fase 4: los reads/writes van a WatermelonDB; en Jest esos
// módulos están mapeados a jest.mocks/* (ver jest.config.js moduleNameMapper).
import { listRoutinesLocal, getWorkoutDetailLocal, listWorkoutsLocal } from '@/db/fitnessQueries';
import {
  startWorkoutLocal,
  finishWorkoutLocal,
  cancelWorkoutLocal,
  addSetLocal,
  deleteSetLocal,
} from '@/db/fitnessWrites';
import {
  useRoutines,
  useWorkoutDetail,
  useWorkoutHistory,
  useStartWorkout,
  useFinishWorkout,
  useCancelWorkout,
  useAddSet,
  useDeleteSet,
} from '../useWorkouts';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useRoutines (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listRoutinesLocal as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useRoutines(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns routines on success', async () => {
    const mockRoutines = [
      {
        id: 'r-1',
        name: 'Push Day',
        exerciseCount: 5,
        lastExecuted: null,
        timesExecuted: 0,
        createdAt: '2026-01-01',
      },
    ];
    (listRoutinesLocal as jest.Mock).mockResolvedValue(mockRoutines);

    const { result } = renderHook(() => useRoutines(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRoutines);
  });

  it('returns error on failure', async () => {
    (listRoutinesLocal as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useRoutines(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useWorkoutDetail', () => {
  it('fetches workout detail by id', async () => {
    const mockDetail = {
      id: 'w-1',
      routineId: 'r-1',
      routineName: 'Push Day',
      startTime: '2026-06-04T10:00:00Z',
      endTime: null,
      duration: null,
      notes: null,
      exercises: [],
      summary: null,
    };
    (getWorkoutDetailLocal as jest.Mock).mockResolvedValue(mockDetail);

    const { result } = renderHook(() => useWorkoutDetail('w-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getWorkoutDetailLocal).toHaveBeenCalledWith('w-1');
    expect(result.current.data).toEqual(mockDetail);
  });

  it('resolves null when id is empty (no lookup)', async () => {
    const { result } = renderHook(() => useWorkoutDetail(''), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(getWorkoutDetailLocal).not.toHaveBeenCalled();
  });
});

describe('useWorkoutHistory', () => {
  it('returns workout history without params', async () => {
    const mockHistory = {
      workouts: [
        {
          id: 'w-1',
          routineId: 'r-1',
          routineName: 'Push Day',
          startTime: '2026-06-01T10:00:00Z',
          duration: 45,
          exercisesCompleted: 5,
          totalSets: 15,
          totalVolume: 2000,
        },
      ],
      pagination: { page: 1, limit: 20, total: 1 },
    };
    (listWorkoutsLocal as jest.Mock).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHistory);
  });

  it('passes pagination params to the local query', async () => {
    const mockHistory = { workouts: [], pagination: { page: 2, limit: 10, total: 0 } };
    (listWorkoutsLocal as jest.Mock).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listWorkoutsLocal).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });
});

describe('useStartWorkout', () => {
  it('calls startWorkoutLocal with routineId', async () => {
    const started = {
      workout: { id: 'w-new', routineId: 'r-1', startTime: '2026-06-04T10:00:00Z' },
      exercises: [],
    };
    (startWorkoutLocal as jest.Mock).mockResolvedValue(started);

    const { result } = renderHook(() => useStartWorkout(), { wrapper: createWrapper() });

    result.current.mutate('r-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(startWorkoutLocal).toHaveBeenCalledWith('r-1');
    expect(result.current.data).toEqual(started);
  });
});

describe('useFinishWorkout', () => {
  it('calls finishWorkoutLocal with workoutId', async () => {
    (finishWorkoutLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFinishWorkout(), { wrapper: createWrapper() });

    result.current.mutate('w-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(finishWorkoutLocal).toHaveBeenCalledWith('w-1');
  });
});

describe('useCancelWorkout', () => {
  it('calls cancelWorkoutLocal with workoutId', async () => {
    (cancelWorkoutLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCancelWorkout(), { wrapper: createWrapper() });

    result.current.mutate('w-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cancelWorkoutLocal).toHaveBeenCalledWith('w-1');
  });
});

describe('useAddSet', () => {
  it('calls addSetLocal with correct params', async () => {
    const mockSet = {
      id: 's-1',
      setNumber: 1,
      reps: 10,
      weight: 60,
      weightUnit: 'kg',
      completed: true,
      notes: null,
      timestamp: '2026-06-04T10:05:00Z',
    };
    (addSetLocal as jest.Mock).mockResolvedValue(mockSet);

    const { result } = renderHook(() => useAddSet(), { wrapper: createWrapper() });

    result.current.mutate({
      workoutId: 'w-1',
      workoutExerciseId: 'we-1',
      dto: { reps: 10, weight: 60 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addSetLocal).toHaveBeenCalledWith('we-1', { reps: 10, weight: 60 });
    expect(result.current.data).toEqual(mockSet);
  });
});

describe('useDeleteSet', () => {
  it('calls deleteSetLocal with the set id', async () => {
    (deleteSetLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSet(), { wrapper: createWrapper() });

    result.current.mutate({ workoutId: 'w-1', workoutExerciseId: 'we-1', setId: 's-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteSetLocal).toHaveBeenCalledWith('s-1');
  });
});
