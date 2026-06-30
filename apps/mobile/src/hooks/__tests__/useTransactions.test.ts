import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/transactionApi');

import { transactionApi } from '../../services/api/transactionApi';
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

describe('useTransactions', () => {
  it('returns loading state initially', () => {
    (transactionApi.list as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns transactions on success', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue(mockListResult);

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockListResult);
  });

  it('passes filters to the API', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue(mockListResult);

    const filters = { accountId: 'a-1', type: 'egreso' as const, limit: 10 };
    const { result } = renderHook(() => useTransactions(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionApi.list).toHaveBeenCalledWith(filters);
  });

  it('returns error on failure', async () => {
    (transactionApi.list as jest.Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTxCategories', () => {
  it('fetches categories without scope', async () => {
    const mockCats = [
      { id: 'cat-1', name: 'Comida' },
      { id: 'cat-2', name: 'Transporte' },
    ];
    (transactionApi.listCategories as jest.Mock).mockResolvedValue(mockCats);

    const { result } = renderHook(() => useTxCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionApi.listCategories).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual(mockCats);
  });

  it('fetches categories with scope', async () => {
    const mockCats = [{ id: 'cat-3', name: 'Salario' }];
    (transactionApi.listCategories as jest.Mock).mockResolvedValue(mockCats);

    const { result } = renderHook(() => useTxCategories('egresos'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionApi.listCategories).toHaveBeenCalledWith('egresos');
  });
});

describe('useCreateTransaction', () => {
  it('calls transactionApi.create with correct dto', async () => {
    const dto = {
      accountId: 'a-1',
      categoryId: 'cat-1',
      type: 'egreso' as const,
      amount: 1500,
      concept: 'Nafta',
      date: '2026-06-04',
    };
    const created = {
      id: 'tx-new',
      ...dto,
      isTransfer: false,
      createdAt: '2026-06-04T12:00:00Z',
      account: {},
      category: {},
    };
    (transactionApi.create as jest.Mock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionApi.create).toHaveBeenCalledWith(dto);
  });
});

describe('useDeleteTransaction', () => {
  it('calls transactionApi.delete with id', async () => {
    (transactionApi.delete as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: createWrapper() });

    result.current.mutate('tx-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(transactionApi.delete).toHaveBeenCalledWith('tx-1');
  });
});
