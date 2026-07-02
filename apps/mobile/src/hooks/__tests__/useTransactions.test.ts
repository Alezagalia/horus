import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Offline-first: los reads/writes van a WatermelonDB; en Jest esos módulos
// están mapeados a jest.mocks/* (ver jest.config.js moduleNameMapper).
import { listTransactionsLocal, listCategoriesLocal } from '@/db/moneyQueries';
import { createTransactionLocal, deleteTransactionLocal } from '@/db/moneyWrites';
import {
  useTransactions,
  useTxCategories,
  useCreateTransaction,
  useDeleteTransaction,
} from '../useTransactions';

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

const mockListResult = {
  transactions: [
    {
      id: 'tx-1',
      accountId: 'a-1',
      categoryId: 'cat-1',
      type: 'egreso' as const,
      amount: 500,
      concept: 'Supermercado',
      date: '2026-06-01',
      isTransfer: false,
      createdAt: '2026-06-01T10:00:00Z',
      account: { id: 'a-1', name: 'Efectivo', type: 'efectivo', currency: 'ARS' },
      category: { id: 'cat-1', name: 'Comida' },
    },
  ],
  pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
  totals: { totalIncome: 0, totalExpenses: 500, balance: -500 },
};

describe('useTransactions (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listTransactionsLocal as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns transactions on success', async () => {
    (listTransactionsLocal as jest.Mock).mockResolvedValue(mockListResult);

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockListResult);
  });

  it('passes filters to the local loader', async () => {
    (listTransactionsLocal as jest.Mock).mockResolvedValue(mockListResult);

    const filters = { accountId: 'a-1', type: 'egreso' as const, limit: 10 };
    const { result } = renderHook(() => useTransactions(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listTransactionsLocal).toHaveBeenCalledWith(filters);
  });

  it('returns error on failure', async () => {
    (listTransactionsLocal as jest.Mock).mockRejectedValue(new Error('db error'));

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTxCategories (lectura local WatermelonDB)', () => {
  it('fetches categories without scope', async () => {
    const mockCats = [
      { id: 'cat-1', name: 'Comida' },
      { id: 'cat-2', name: 'Transporte' },
    ];
    (listCategoriesLocal as jest.Mock).mockResolvedValue(mockCats);

    const { result } = renderHook(() => useTxCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCategoriesLocal).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual(mockCats);
  });

  it('fetches categories with scope', async () => {
    const mockCats = [{ id: 'cat-3', name: 'Salario' }];
    (listCategoriesLocal as jest.Mock).mockResolvedValue(mockCats);

    const { result } = renderHook(() => useTxCategories('egresos'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCategoriesLocal).toHaveBeenCalledWith('egresos');
  });
});

describe('useCreateTransaction (escritura local)', () => {
  it('calls createTransactionLocal with correct dto', async () => {
    const dto = {
      accountId: 'a-1',
      categoryId: 'cat-1',
      type: 'egreso' as const,
      amount: 1500,
      concept: 'Nafta',
      date: '2026-06-04',
    };
    (createTransactionLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createTransactionLocal).toHaveBeenCalledWith(dto);
  });
});

describe('useDeleteTransaction (escritura local)', () => {
  it('calls deleteTransactionLocal with id', async () => {
    (deleteTransactionLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: createWrapper() });

    result.current.mutate('tx-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteTransactionLocal).toHaveBeenCalledWith('tx-1');
  });
});
