import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('../../services/api/accountApi');

import { accountApi } from '../../services/api/accountApi';
// Offline-first: los reads/writes van a WatermelonDB; en Jest esos módulos
// están mapeados a jest.mocks/* (ver jest.config.js moduleNameMapper).
import { listAccountsLocal } from '@/db/moneyQueries';
import { createAccountLocal, updateAccountLocal, deactivateAccountLocal } from '@/db/moneyWrites';
import {
  useAccounts,
  useFinanceStats,
  useCreateAccount,
  useUpdateAccount,
  useDeactivateAccount,
} from '../useAccounts';

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

describe('useAccounts (lectura local WatermelonDB)', () => {
  it('returns loading state initially', () => {
    (listAccountsLocal as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns accounts on success', async () => {
    const mockData = {
      accounts: [
        {
          id: 'a-1',
          name: 'Efectivo',
          type: 'efectivo',
          balance: 5000,
          currency: 'ARS',
          isActive: true,
        },
      ],
      totalBalanceByCurrency: { ARS: 5000 },
    };
    (listAccountsLocal as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('returns error on failure', async () => {
    (listAccountsLocal as jest.Mock).mockRejectedValue(new Error('db error'));

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useFinanceStats (sigue online/REST)', () => {
  it('fetches stats without params', async () => {
    const mockStats = {
      month: 6,
      year: 2026,
      totalIncome: 100000,
      totalExpense: 60000,
      balance: 40000,
      currency: 'ARS',
    };
    (accountApi.getFinanceStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useFinanceStats(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountApi.getFinanceStats).toHaveBeenCalledWith(undefined, undefined);
    expect(result.current.data).toEqual(mockStats);
  });

  it('fetches stats with month and year', async () => {
    const mockStats = {
      month: 5,
      year: 2026,
      totalIncome: 80000,
      totalExpense: 50000,
      balance: 30000,
      currency: 'ARS',
    };
    (accountApi.getFinanceStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useFinanceStats(5, 2026), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(accountApi.getFinanceStats).toHaveBeenCalledWith(5, 2026);
  });
});

describe('useCreateAccount (escritura local)', () => {
  it('calls createAccountLocal with correct dto', async () => {
    const dto = {
      name: 'Banco Nación',
      type: 'banco' as const,
      currency: 'ARS',
      initialBalance: 10000,
    };
    (createAccountLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCreateAccount(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createAccountLocal).toHaveBeenCalledWith(dto);
  });
});

describe('useUpdateAccount (escritura local)', () => {
  it('calls updateAccountLocal with id and dto', async () => {
    (updateAccountLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateAccount(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'a-1', dto: { name: 'Cuenta actualizada' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateAccountLocal).toHaveBeenCalledWith('a-1', { name: 'Cuenta actualizada' });
  });
});

describe('useDeactivateAccount (escritura local)', () => {
  it('calls deactivateAccountLocal with id', async () => {
    (deactivateAccountLocal as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeactivateAccount(), { wrapper: createWrapper() });

    result.current.mutate('a-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deactivateAccountLocal).toHaveBeenCalledWith('a-1');
  });
});
