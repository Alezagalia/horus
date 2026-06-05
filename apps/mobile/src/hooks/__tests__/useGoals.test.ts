import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/goalApi');

import { goalApi } from '../../services/api/goalApi';
import {
  useGoals,
  useGoal,
  useFeaturedGoal,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useFeatureGoal,
  useCreateKeyResult,
  useUpdateKeyResult,
  useDeleteKeyResult,
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

describe('useGoals', () => {
  it('returns loading state initially', () => {
    (goalApi.list as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns goals on success', async () => {
    const mockGoals = [{ id: 'g-1', title: 'Aprender TypeScript', status: 'en_progreso' }];
    (goalApi.list as jest.Mock).mockResolvedValue(mockGoals);

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGoals);
  });

  it('filters goals by status', async () => {
    const mockGoals = [{ id: 'g-2', title: 'Correr 5km', status: 'completada' }];
    (goalApi.list as jest.Mock).mockResolvedValue(mockGoals);

    const { result } = renderHook(() => useGoals('completada'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.list).toHaveBeenCalledWith('completada');
  });

  it('returns error on failure', async () => {
    (goalApi.list as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGoals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useGoal', () => {
  it('fetches goal by id', async () => {
    const mockGoal = { id: 'g-1', title: 'Meta específica' };
    (goalApi.getById as jest.Mock).mockResolvedValue(mockGoal);

    const { result } = renderHook(() => useGoal('g-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.getById).toHaveBeenCalledWith('g-1');
    expect(result.current.data).toEqual(mockGoal);
  });

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useGoal(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(goalApi.getById).not.toHaveBeenCalled();
  });
});

describe('useFeaturedGoal', () => {
  it('returns featured goal', async () => {
    const featured = { id: 'g-1', title: 'Meta destacada', isFeatured: true };
    (goalApi.getFeaturedGoal as jest.Mock).mockResolvedValue(featured);

    const { result } = renderHook(() => useFeaturedGoal(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(featured);
  });

  it('returns null when no featured goal', async () => {
    (goalApi.getFeaturedGoal as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useFeaturedGoal(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useCreateGoal', () => {
  it('calls goalApi.create with correct dto', async () => {
    const dto = { title: 'Nueva meta', description: 'Descripción', status: 'en_progreso' as const };
    const created = { id: 'g-new', ...dto };
    (goalApi.create as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateGoal(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.create).toHaveBeenCalledWith(dto);
  });
});

describe('useUpdateGoal', () => {
  it('calls goalApi.update with id and dto', async () => {
    const updated = { id: 'g-1', title: 'Meta actualizada' };
    (goalApi.update as jest.Mock).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateGoal(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'g-1', dto: { title: 'Meta actualizada' } } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.update).toHaveBeenCalledWith('g-1', { title: 'Meta actualizada' });
  });
});

describe('useDeleteGoal', () => {
  it('calls goalApi.remove with id', async () => {
    (goalApi.remove as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteGoal(), { wrapper: createWrapper() });

    result.current.mutate('g-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.remove).toHaveBeenCalledWith('g-1');
  });
});

describe('useFeatureGoal', () => {
  it('calls goalApi.featureGoal with id', async () => {
    const featured = { id: 'g-1', isFeatured: true };
    (goalApi.featureGoal as jest.Mock).mockResolvedValue(featured);

    const { result } = renderHook(() => useFeatureGoal(), { wrapper: createWrapper() });

    result.current.mutate('g-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.featureGoal).toHaveBeenCalledWith('g-1');
  });
});

describe('useCreateKeyResult', () => {
  it('calls goalApi.createKeyResult with goalId and dto', async () => {
    const kr = { id: 'kr-1', title: 'Completar 10 lecciones', targetValue: 10 };
    (goalApi.createKeyResult as jest.Mock).mockResolvedValue(kr);

    const { result } = renderHook(() => useCreateKeyResult(), { wrapper: createWrapper() });

    result.current.mutate({
      goalId: 'g-1',
      dto: { title: 'Completar 10 lecciones', targetValue: 10 } as any,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.createKeyResult).toHaveBeenCalledWith('g-1', {
      title: 'Completar 10 lecciones',
      targetValue: 10,
    });
  });
});

describe('useUpdateKeyResult', () => {
  it('calls goalApi.updateKeyResult with correct params', async () => {
    const updated = { id: 'kr-1', currentValue: 5 };
    (goalApi.updateKeyResult as jest.Mock).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateKeyResult(), { wrapper: createWrapper() });

    result.current.mutate({ goalId: 'g-1', krId: 'kr-1', dto: { currentValue: 5 } as any });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.updateKeyResult).toHaveBeenCalledWith('g-1', 'kr-1', { currentValue: 5 });
  });
});

describe('useDeleteKeyResult', () => {
  it('calls goalApi.deleteKeyResult with goalId and krId', async () => {
    (goalApi.deleteKeyResult as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteKeyResult(), { wrapper: createWrapper() });

    result.current.mutate({ goalId: 'g-1', krId: 'kr-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(goalApi.deleteKeyResult).toHaveBeenCalledWith('g-1', 'kr-1');
  });
});
