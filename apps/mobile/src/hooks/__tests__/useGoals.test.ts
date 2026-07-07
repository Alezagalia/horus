import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Offline-first Fase 2c: los reads/writes van a WatermelonDB; en Jest esos
// módulos están mapeados a jest.mocks/* (ver jest.config.js moduleNameMapper).
import { listGoalsLocal, getFeaturedGoalLocal } from '@/db/goalQueries';
import { createGoalLocal, featureGoalLocal, createKeyResultLocal } from '@/db/goalWrites';
import {
  useGoals,
  useFeaturedGoal,
  useCreateGoal,
  useFeatureGoal,
  useCreateKeyResult,
} from '../useGoals';

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

describe('useGoals (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listGoalsLocal as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns goals with progress on success', async () => {
    const mockGoals = [{ id: 'g-1', title: 'Correr 100km', progress: 42 }];
    (listGoalsLocal as jest.Mock).mockResolvedValue(mockGoals);

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGoals);
  });

  it('passes the status filter to the local loader', async () => {
    (listGoalsLocal as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useGoals('en_progreso'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listGoalsLocal).toHaveBeenCalledWith('en_progreso');
  });
});

describe('useFeaturedGoal (lectura local)', () => {
  it('returns the featured goal or null', async () => {
    (getFeaturedGoalLocal as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useFeaturedGoal(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('mutaciones de metas (escritura local)', () => {
  it('creates via createGoalLocal', async () => {
    (createGoalLocal as jest.Mock).mockResolvedValue(undefined);
    const dto = { title: 'Nueva meta', priority: 'alta' as const };

    const { result } = renderHook(() => useCreateGoal(), { wrapper: createWrapper() });
    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createGoalLocal).toHaveBeenCalledWith(dto);
  });

  it('toggles featured via featureGoalLocal', async () => {
    (featureGoalLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFeatureGoal(), { wrapper: createWrapper() });
    result.current.mutate('g-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(featureGoalLocal).toHaveBeenCalledWith('g-1');
  });

  it('creates a key result via createKeyResultLocal', async () => {
    (createKeyResultLocal as jest.Mock).mockResolvedValue(undefined);
    const dto = { title: 'Km corridos', targetValue: 100, unit: 'km' };

    const { result } = renderHook(() => useCreateKeyResult(), { wrapper: createWrapper() });
    result.current.mutate({ goalId: 'g-1', dto });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createKeyResultLocal).toHaveBeenCalledWith('g-1', dto);
  });
});
