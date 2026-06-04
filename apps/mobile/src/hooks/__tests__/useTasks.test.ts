import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/taskApi');
jest.mock('../../services/api/categoryApi');

import { taskApi } from '../../services/api/taskApi';
import { useTasks, useToggleTaskComplete, useCreateTask } from '../useTasks';

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

describe('useTasks', () => {
  it('returns loading state initially', () => {
    (taskApi.list as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns tasks on success', async () => {
    const mockTasks = [{ id: 't-1', title: 'Buy groceries', status: 'pendiente' }];
    (taskApi.list as jest.Mock).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTasks);
  });

  it('returns tasks filtered by status', async () => {
    const mockTasks = [{ id: 't-1', title: 'Task', status: 'pendiente' }];
    (taskApi.list as jest.Mock).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTasks({ status: 'pendiente' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(taskApi.list).toHaveBeenCalledWith({ status: 'pendiente' });
  });

  it('handles error state', async () => {
    (taskApi.list as jest.Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useToggleTaskComplete', () => {
  it('calls taskApi.toggle with task id', async () => {
    const toggled = { id: 't-1', status: 'completada' };
    (taskApi.toggle as jest.Mock).mockResolvedValue(toggled);

    const { result } = renderHook(() => useToggleTaskComplete(), { wrapper: createWrapper() });

    result.current.mutate('t-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(taskApi.toggle).toHaveBeenCalledWith('t-1');
  });
});

describe('useCreateTask', () => {
  it('calls taskApi.create with dto', async () => {
    const dto = { title: 'New Task', categoryId: 'cat-1', priority: 'media' };
    const created = { id: 't-new', ...dto, status: 'pendiente' };
    (taskApi.create as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(taskApi.create).toHaveBeenCalledWith(dto);
  });
});
