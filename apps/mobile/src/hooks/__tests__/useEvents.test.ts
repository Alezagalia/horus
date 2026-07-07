import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Offline-first: eventos y gastos recurrentes van a WatermelonDB; en Jest
// esos módulos están mapeados a jest.mocks/* (ver jest.config.js).
import { listRecurringExpensesLocal, listCategoriesLocal } from '@/db/moneyQueries';
import {
  createRecurringExpenseLocal,
  updateRecurringExpenseLocal,
  deleteRecurringExpenseLocal,
} from '@/db/moneyWrites';
import { listUpcomingEventsLocal, listCalendarEventsLocal } from '@/db/eventQueries';
import { createEventLocal, updateEventLocal, deleteEventLocal } from '@/db/eventWrites';
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

describe('useUpcomingEvents (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listUpcomingEventsLocal as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useUpcomingEvents(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns upcoming events with default days=3', async () => {
    const mockEvents = [mockEvent];
    (listUpcomingEventsLocal as jest.Mock).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useUpcomingEvents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listUpcomingEventsLocal).toHaveBeenCalledWith(3);
    expect(result.current.data).toEqual(mockEvents);
  });

  it('uses custom days param', async () => {
    (listUpcomingEventsLocal as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useUpcomingEvents(7), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listUpcomingEventsLocal).toHaveBeenCalledWith(7);
  });

  it('returns error on failure', async () => {
    (listUpcomingEventsLocal as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useUpcomingEvents(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCalendarEvents (lectura local)', () => {
  it('returns events for given date range', async () => {
    const mockEvents = [mockEvent];
    (listCalendarEventsLocal as jest.Mock).mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useCalendarEvents('2026-06-01', '2026-06-30'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCalendarEventsLocal).toHaveBeenCalledWith('2026-06-01', '2026-06-30');
    expect(result.current.data).toEqual(mockEvents);
  });
});

describe('useCreateEvent (escritura local)', () => {
  it('creates via createEventLocal', async () => {
    const dto = {
      title: 'Nueva reunión',
      startDateTime: '2026-06-10T09:00:00Z',
      endDateTime: '2026-06-10T10:00:00Z',
      isAllDay: false,
      categoryId: 'cat-1',
    };
    (createEventLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCreateEvent(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createEventLocal).toHaveBeenCalledWith(dto);
  });
});

describe('useUpdateEvent (escritura local)', () => {
  it('updates via updateEventLocal', async () => {
    (updateEventLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'ev-1', dto: { title: 'Reunión actualizada' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateEventLocal).toHaveBeenCalledWith('ev-1', { title: 'Reunión actualizada' });
  });
});

describe('useDeleteEvent (escritura local)', () => {
  it('deletes via deleteEventLocal', async () => {
    (deleteEventLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEvent(), { wrapper: createWrapper() });

    result.current.mutate('ev-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteEventLocal).toHaveBeenCalledWith('ev-1');
  });
});

describe('useEventCategories (lectura local)', () => {
  it('returns event categories from the local db', async () => {
    const mockCats = [
      { id: 'cat-1', name: 'Personal' },
      { id: 'cat-2', name: 'Trabajo' },
    ];
    (listCategoriesLocal as jest.Mock).mockResolvedValue(mockCats);

    const { result } = renderHook(() => useEventCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCategoriesLocal).toHaveBeenCalledWith('eventos');
    expect(result.current.data).toEqual(mockCats);
  });
});

describe('useRecurringExpenses (lectura local WatermelonDB)', () => {
  it('returns active recurring expenses', async () => {
    const mockExpenses = [{ id: 're-1', concept: 'Netflix', currency: 'ARS' }];
    (listRecurringExpensesLocal as jest.Mock).mockResolvedValue(mockExpenses);

    const { result } = renderHook(() => useRecurringExpenses(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listRecurringExpensesLocal).toHaveBeenCalledWith(true);
    expect(result.current.data).toEqual(mockExpenses);
  });

  it('returns all recurring expenses when no filter', async () => {
    (listRecurringExpensesLocal as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useRecurringExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listRecurringExpensesLocal).toHaveBeenCalledWith(undefined);
  });
});

describe('useCreateRecurringExpense (escritura local)', () => {
  it('calls createRecurringExpenseLocal with dto', async () => {
    const dto = { concept: 'Spotify', categoryId: 'cat-1', currency: 'ARS', dueDay: 15 };
    (createRecurringExpenseLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCreateRecurringExpense(), { wrapper: createWrapper() });

    result.current.mutate(dto as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createRecurringExpenseLocal).toHaveBeenCalledWith(dto);
  });
});

describe('useUpdateRecurringExpense (escritura local)', () => {
  it('calls updateRecurringExpenseLocal with id and dto', async () => {
    (updateRecurringExpenseLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateRecurringExpense(), { wrapper: createWrapper() });

    result.current.mutate({ id: 're-1', dto: { concept: 'Netflix 4K' } as any });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateRecurringExpenseLocal).toHaveBeenCalledWith('re-1', { concept: 'Netflix 4K' });
  });
});

describe('useDeleteRecurringExpense (escritura local)', () => {
  it('calls deleteRecurringExpenseLocal with id', async () => {
    (deleteRecurringExpenseLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRecurringExpense(), { wrapper: createWrapper() });

    result.current.mutate('re-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteRecurringExpenseLocal).toHaveBeenCalledWith('re-1');
  });
});
