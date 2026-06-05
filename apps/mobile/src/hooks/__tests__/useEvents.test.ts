import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/eventApi');
jest.mock('../../services/api/categoryApi');
jest.mock('../../services/api/recurringExpenseApi');

import { eventApi } from '../../services/api/eventApi';
import { categoryApi } from '../../services/api/categoryApi';
import { recurringExpenseApi } from '../../services/api/recurringExpenseApi';
import {
  useUpcomingEvents,
  useCalendarEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEventCategories,
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
} from '../useEvents';

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

const mockEvent = {
  id: 'ev-1',
  title: 'Reunión',
  startDate: '2026-06-05T10:00:00Z',
  endDate: '2026-06-05T11:00:00Z',
};

describe('useUpcomingEvents', () => {
  it('returns loading state initially', () => {
    (eventApi.listUpcoming as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useUpcomingEvents(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns upcoming events with default days=3', async () => {
    const mockEvents = [mockEvent];
    (eventApi.listUpcoming as jest.Mock).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useUpcomingEvents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventApi.listUpcoming).toHaveBeenCalledWith(3);
    expect(result.current.data).toEqual(mockEvents);
  });

  it('uses custom days param', async () => {
    (eventApi.listUpcoming as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingEvents(7), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventApi.listUpcoming).toHaveBeenCalledWith(7);
  });

  it('returns error on failure', async () => {
    (eventApi.listUpcoming as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpcomingEvents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCalendarEvents', () => {
  it('returns events for given date range', async () => {
    const mockEvents = [mockEvent];
    (eventApi.list as jest.Mock).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useCalendarEvents('2026-06-01', '2026-06-30'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventApi.list).toHaveBeenCalledWith('2026-06-01', '2026-06-30');
    expect(result.current.data).toEqual(mockEvents);
  });
});

describe('useCreateEvent', () => {
  it('calls eventApi.create with dto', async () => {
    const dto = {
      title: 'Nueva reunión',
      startDate: '2026-06-10T09:00:00Z',
      endDate: '2026-06-10T10:00:00Z',
      allDay: false,
    };
    (eventApi.create as jest.Mock).mockResolvedValue({ id: 'ev-new', ...dto });

    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventApi.create).toHaveBeenCalledWith(dto);
  });
});

describe('useUpdateEvent', () => {
  it('calls eventApi.update with id and dto', async () => {
    const updated = { id: 'ev-1', title: 'Reunión actualizada' };
    (eventApi.update as jest.Mock).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'ev-1', dto: { title: 'Reunión actualizada' } as any });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventApi.update).toHaveBeenCalledWith('ev-1', { title: 'Reunión actualizada' });
  });
});

describe('useDeleteEvent', () => {
  it('calls eventApi.del with id', async () => {
    (eventApi.del as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEvent(), { wrapper: createWrapper() });

    result.current.mutate('ev-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(eventApi.del).toHaveBeenCalledWith('ev-1');
  });
});

describe('useEventCategories', () => {
  it('returns event categories', async () => {
    const mockCats = [
      { id: 'cat-1', name: 'Personal' },
      { id: 'cat-2', name: 'Trabajo' },
    ];
    (categoryApi.listByScope as jest.Mock).mockResolvedValue(mockCats);

    const { result } = renderHook(() => useEventCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(categoryApi.listByScope).toHaveBeenCalledWith('eventos');
    expect(result.current.data).toEqual(mockCats);
  });
});

describe('useRecurringExpenses', () => {
  it('returns active recurring expenses', async () => {
    const mockExpenses = [{ id: 're-1', name: 'Netflix', amount: 1500, currency: 'ARS' }];
    (recurringExpenseApi.list as jest.Mock).mockResolvedValue(mockExpenses);

    const { result } = renderHook(() => useRecurringExpenses(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recurringExpenseApi.list).toHaveBeenCalledWith(true);
    expect(result.current.data).toEqual(mockExpenses);
  });

  it('returns all recurring expenses when no filter', async () => {
    (recurringExpenseApi.list as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useRecurringExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recurringExpenseApi.list).toHaveBeenCalledWith(undefined);
  });
});

describe('useCreateRecurringExpense', () => {
  it('calls recurringExpenseApi.create with dto', async () => {
    const dto = { name: 'Spotify', amount: 600, currency: 'ARS', dayOfMonth: 15 };
    const created = { id: 're-new', ...dto };
    (recurringExpenseApi.create as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateRecurringExpense(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recurringExpenseApi.create).toHaveBeenCalledWith(dto);
  });
});

describe('useUpdateRecurringExpense', () => {
  it('calls recurringExpenseApi.update with id and dto', async () => {
    const updated = { id: 're-1', amount: 700 };
    (recurringExpenseApi.update as jest.Mock).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateRecurringExpense(), { wrapper: createWrapper() });

    result.current.mutate({ id: 're-1', dto: { amount: 700 } as any });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recurringExpenseApi.update).toHaveBeenCalledWith('re-1', { amount: 700 });
  });
});

describe('useDeleteRecurringExpense', () => {
  it('calls recurringExpenseApi.remove with id', async () => {
    (recurringExpenseApi.remove as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRecurringExpense(), { wrapper: createWrapper() });

    result.current.mutate('re-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(recurringExpenseApi.remove).toHaveBeenCalledWith('re-1');
  });
});
