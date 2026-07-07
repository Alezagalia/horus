import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Offline-first Fase 2b: los reads/writes van a WatermelonDB; en Jest esos
// módulos están mapeados a jest.mocks/* (ver jest.config.js moduleNameMapper).
import { listTasksLocal } from '@/db/taskQueries';
import { createTaskLocal, toggleTaskLocal, addChecklistItemLocal } from '@/db/taskWrites';
import { useTasks, useToggleTaskComplete, useCreateTask, useAddChecklistItem } from '../useTasks';

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

describe('useTasks (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listTasksLocal as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns tasks on success', async () => {
    const mockTasks = [{ id: 't-1', title: 'Buy groceries', status: 'pendiente' }];
    (listTasksLocal as jest.Mock).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTasks);
  });

  it('passes the status filter to the local loader', async () => {
    (listTasksLocal as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useTasks({ status: 'pendiente' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listTasksLocal).toHaveBeenCalledWith({ status: 'pendiente' });
  });

  it('handles error state', async () => {
    (listTasksLocal as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useToggleTaskComplete (escritura local)', () => {
  it('toggles via toggleTaskLocal', async () => {
    (toggleTaskLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleTaskComplete(), { wrapper: createWrapper() });

    result.current.mutate('t-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toggleTaskLocal).toHaveBeenCalledWith('t-1');
  });
});

describe('useCreateTask (escritura local)', () => {
  it('creates via createTaskLocal', async () => {
    (createTaskLocal as jest.Mock).mockResolvedValue(undefined);
    const dto = { title: 'New Task', categoryId: 'cat-1', priority: 'media' as const };

    const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createTaskLocal).toHaveBeenCalledWith(dto);
  });
});

describe('useAddChecklistItem (escritura local)', () => {
  it('adds the item and returns it for the optimistic UI', async () => {
    const item = { id: 'i-1', title: 'Subtarea', completed: false };
    (addChecklistItemLocal as jest.Mock).mockResolvedValue(item);

    const { result } = renderHook(() => useAddChecklistItem(), { wrapper: createWrapper() });

    result.current.mutate({ taskId: 't-1', title: 'Subtarea' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addChecklistItemLocal).toHaveBeenCalledWith('t-1', 'Subtarea');
    expect(result.current.data).toEqual(item);
  });
});
