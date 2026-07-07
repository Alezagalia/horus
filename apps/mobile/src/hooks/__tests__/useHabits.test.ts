import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Offline-first Fase 2: los reads/writes van a WatermelonDB; en Jest esos
// módulos están mapeados a jest.mocks/* (ver jest.config.js moduleNameMapper).
import { listHabitsLocal, getHabitStatsLocal } from '@/db/habitQueries';
import { createHabitLocal, setHabitRecordLocal } from '@/db/habitWrites';
import {
  useHabits,
  useHabitStats,
  useToggleHabitComplete,
  useCreateHabit,
  useNumericHabitProgress,
} from '../useHabits';

jest.mock('../useGoals', () => ({ goalKeys: { all: ['goals'] } }));

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

describe('useHabits (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listHabitsLocal as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns habits on success', async () => {
    const mockHabits = [{ id: '1', name: 'Meditar', type: 'CHECK' }];
    (listHabitsLocal as jest.Mock).mockResolvedValue(mockHabits);

    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHabits);
  });

  it('passes the date to the local loader', async () => {
    (listHabitsLocal as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useHabits('2026-07-07'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listHabitsLocal).toHaveBeenCalledWith('2026-07-07');
  });

  it('returns error on failure', async () => {
    (listHabitsLocal as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useHabitStats (cálculo local)', () => {
  it('returns today stats from the local loader', async () => {
    const stats = {
      today: { total: 4, completed: 2, percentage: 0.5 },
      streaks: { currentBest: 7, longestEver: 21 },
    };
    (getHabitStatsLocal as jest.Mock).mockResolvedValue(stats);

    const { result } = renderHook(() => useHabitStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stats);
    // Se calcula para el día actual (formato yyyy-MM-dd)
    expect(getHabitStatsLocal).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
});

describe('useToggleHabitComplete (escritura local)', () => {
  it('upserts the record via setHabitRecordLocal', async () => {
    (setHabitRecordLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleHabitComplete(), { wrapper: createWrapper() });

    result.current.mutate({ habitId: 'h-1', date: '2026-06-01', completed: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setHabitRecordLocal).toHaveBeenCalledWith({
      habitId: 'h-1',
      date: '2026-06-01',
      completed: true,
    });
  });
});

describe('useNumericHabitProgress (escritura local)', () => {
  it('records the value as a completed record', async () => {
    (setHabitRecordLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNumericHabitProgress(), { wrapper: createWrapper() });

    result.current.mutate({ habitId: 'h-2', date: '2026-06-01', value: 8 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setHabitRecordLocal).toHaveBeenCalledWith({
      habitId: 'h-2',
      date: '2026-06-01',
      completed: true,
      value: 8,
    });
  });
});

describe('useCreateHabit (escritura local)', () => {
  it('creates the habit via createHabitLocal', async () => {
    (createHabitLocal as jest.Mock).mockResolvedValue(undefined);
    const dto = {
      name: 'New Habit',
      type: 'CHECK' as const,
      categoryId: 'cat-1',
      periodicity: 'DAILY' as const,
      weekDays: [],
      timeOfDay: 'morning',
    };

    const { result } = renderHook(() => useCreateHabit(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createHabitLocal).toHaveBeenCalledWith(dto);
  });
});
