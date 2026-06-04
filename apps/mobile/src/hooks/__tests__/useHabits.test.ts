import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/habitApi');
jest.mock('../../services/api/categoryApi');
jest.mock('./useGoals', () => ({ goalKeys: { all: ['goals'] } }));

import { habitApi } from '../../services/api/habitApi';
import { useHabits, useToggleHabitComplete, useCreateHabit } from '../useHabits';

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

describe('useHabits', () => {
  it('returns loading state initially', () => {
    (habitApi.list as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns habits on success', async () => {
    const mockHabits = [{ id: '1', name: 'Meditar', type: 'CHECK' }];
    (habitApi.list as jest.Mock).mockResolvedValue(mockHabits);

    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHabits);
  });

  it('returns error on failure', async () => {
    (habitApi.list as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useToggleHabitComplete', () => {
  it('calls habitApi.toggleRecord with correct params', async () => {
    (habitApi.toggleRecord as jest.Mock).mockResolvedValue({ id: 'rec-1', completed: true });

    const { result } = renderHook(() => useToggleHabitComplete(), { wrapper: createWrapper() });

    result.current.mutate({ habitId: 'h-1', date: '2026-06-01', completed: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(habitApi.toggleRecord).toHaveBeenCalledWith('h-1', '2026-06-01', true);
  });
});

describe('useCreateHabit', () => {
  it('calls habitApi.create and returns created habit', async () => {
    const dto = {
      name: 'New Habit',
      type: 'CHECK',
      categoryId: 'cat-1',
      periodicity: 'DAILY',
      weekDays: [],
      timeOfDay: 'morning',
      order: 0,
    };
    const created = { id: 'h-new', ...dto };
    (habitApi.create as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateHabit(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(habitApi.create).toHaveBeenCalledWith(dto);
  });
});
