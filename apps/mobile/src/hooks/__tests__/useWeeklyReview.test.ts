import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/weeklyReviewApi');

import { weeklyReviewApi } from '../../services/api/weeklyReviewApi';
import {
  useWeeklyStats,
  useCurrentReview,
  useReviewHistory,
  useReviewQuestions,
  useCreateReview,
  useUpdateReview,
} from '../useWeeklyReview';

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

const WEEK_START = '2026-06-01';

describe('useWeeklyStats', () => {
  it('returns loading state initially', () => {
    (weeklyReviewApi.getStats as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useWeeklyStats(WEEK_START), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns stats on success', async () => {
    const mockStats = { habitsCompleted: 5, habitsTotal: 7, tasksCompleted: 3, tasksTotal: 5 };
    (weeklyReviewApi.getStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useWeeklyStats(WEEK_START), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weeklyReviewApi.getStats).toHaveBeenCalledWith(WEEK_START);
    expect(result.current.data).toEqual(mockStats);
  });

  it('returns error on failure', async () => {
    (weeklyReviewApi.getStats as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useWeeklyStats(WEEK_START), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCurrentReview', () => {
  it('returns current review when exists', async () => {
    const mockReview = { id: 'wr-1', weekStart: WEEK_START, status: 'draft', answers: [] };
    (weeklyReviewApi.getCurrent as jest.Mock).mockResolvedValue(mockReview);

    const { result } = renderHook(() => useCurrentReview(WEEK_START), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weeklyReviewApi.getCurrent).toHaveBeenCalledWith(WEEK_START);
    expect(result.current.data).toEqual(mockReview);
  });

  it('returns null when no current review', async () => {
    (weeklyReviewApi.getCurrent as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useCurrentReview(WEEK_START), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useReviewHistory', () => {
  it('returns review history', async () => {
    const mockHistory = [
      { id: 'wr-1', weekStart: '2026-05-25', status: 'completed' },
      { id: 'wr-2', weekStart: '2026-05-18', status: 'completed' },
    ];
    (weeklyReviewApi.getHistory as jest.Mock).mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useReviewHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHistory);
  });

  it('returns empty array when no history', async () => {
    (weeklyReviewApi.getHistory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useReviewHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe('useReviewQuestions', () => {
  it('returns review questions', async () => {
    const mockQuestions = [
      { id: 'q-1', text: '¿Cuál fue tu mayor logro esta semana?', order: 1 },
      { id: 'q-2', text: '¿Qué podrías mejorar?', order: 2 },
    ];
    (weeklyReviewApi.getQuestions as jest.Mock).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useReviewQuestions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockQuestions);
  });
});

describe('useCreateReview', () => {
  it('calls weeklyReviewApi.create with dto', async () => {
    const dto = { weekStart: WEEK_START, answers: [], focusGoalIds: [] };
    const created = { id: 'wr-new', weekStart: WEEK_START, status: 'draft', answers: [] };
    (weeklyReviewApi.create as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weeklyReviewApi.create).toHaveBeenCalledWith(dto);
    expect(result.current.data).toEqual(created);
  });
});

describe('useUpdateReview', () => {
  it('calls weeklyReviewApi.update with id and dto', async () => {
    const updated = { id: 'wr-1', weekStart: WEEK_START, status: 'completed', answers: [] };
    (weeklyReviewApi.update as jest.Mock).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateReview(), { wrapper: createWrapper() });

    result.current.mutate({
      id: 'wr-1',
      dto: { status: 'completed' } as any,
      weekStart: WEEK_START,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weeklyReviewApi.update).toHaveBeenCalledWith('wr-1', { status: 'completed' });
  });
});
