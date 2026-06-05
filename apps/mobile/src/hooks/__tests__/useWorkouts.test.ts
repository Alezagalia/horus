import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/workoutApi');

import { workoutApi } from '../../services/api/workoutApi';
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

describe('useRoutines', () => {
  it('returns loading state initially', () => {
    (workoutApi.listRoutines as jest.Mock).mockReturnValue(new Promise(() => {}));
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
    (workoutApi.listRoutines as jest.Mock).mockResolvedValue(mockRoutines);

    const { result } = renderHook(() => useRoutines(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRoutines);
  });

  it('returns error on failure', async () => {
    (workoutApi.listRoutines as jest.Mock).mockRejectedValue(new Error('Network error'));

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
    (workoutApi.getWorkoutById as jest.Mock).mockResolvedValue(mockDetail);

    const { result } = renderHook(() => useWorkoutDetail('w-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.getWorkoutById).toHaveBeenCalledWith('w-1');
    expect(result.current.data).toEqual(mockDetail);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useWorkoutDetail(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(workoutApi.getWorkoutById).not.toHaveBeenCalled();
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
    (workoutApi.listWorkouts as jest.Mock).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHistory);
  });

  it('passes pagination params to API', async () => {
    const mockHistory = { workouts: [], pagination: { page: 2, limit: 10, total: 0 } };
    (workoutApi.listWorkouts as jest.Mock).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutHistory({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.listWorkouts).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });
});

describe('useStartWorkout', () => {
  it('calls workoutApi.startWorkout with routineId', async () => {
    const started = {
      workout: { id: 'w-new', routineId: 'r-1', startTime: '2026-06-04T10:00:00Z' },
      exercises: [],
    };
    (workoutApi.startWorkout as jest.Mock).mockResolvedValue(started);

    const { result } = renderHook(() => useStartWorkout(), { wrapper: createWrapper() });

    result.current.mutate('r-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.startWorkout).toHaveBeenCalledWith('r-1');
    expect(result.current.data).toEqual(started);
  });
});

describe('useFinishWorkout', () => {
  it('calls workoutApi.finishWorkout with workoutId', async () => {
    (workoutApi.finishWorkout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFinishWorkout(), { wrapper: createWrapper() });

    result.current.mutate('w-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.finishWorkout).toHaveBeenCalledWith('w-1');
  });
});

describe('useCancelWorkout', () => {
  it('calls workoutApi.cancelWorkout with workoutId', async () => {
    (workoutApi.cancelWorkout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCancelWorkout(), { wrapper: createWrapper() });

    result.current.mutate('w-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.cancelWorkout).toHaveBeenCalledWith('w-1');
  });
});

describe('useAddSet', () => {
  it('calls workoutApi.addSet with correct params', async () => {
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
    (workoutApi.addSet as jest.Mock).mockResolvedValue(mockSet);

    const { result } = renderHook(() => useAddSet(), { wrapper: createWrapper() });

    result.current.mutate({
      workoutId: 'w-1',
      workoutExerciseId: 'we-1',
      dto: { reps: 10, weight: 60 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.addSet).toHaveBeenCalledWith('w-1', 'we-1', { reps: 10, weight: 60 });
    expect(result.current.data).toEqual(mockSet);
  });
});

describe('useDeleteSet', () => {
  it('calls workoutApi.deleteSet with correct params', async () => {
    (workoutApi.deleteSet as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSet(), { wrapper: createWrapper() });

    result.current.mutate({ workoutId: 'w-1', workoutExerciseId: 'we-1', setId: 's-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutApi.deleteSet).toHaveBeenCalledWith('w-1', 'we-1', 's-1');
  });
});
