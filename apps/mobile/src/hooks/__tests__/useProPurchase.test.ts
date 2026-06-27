import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import React from 'react';

jest.mock('react-native-iap', () => ({
  initConnection: jest.fn().mockResolvedValue(true),
  endConnection: jest.fn().mockResolvedValue(true),
  flushFailedPurchasesCachedAsPendingAndroid: jest.fn().mockResolvedValue(undefined),
  getSubscriptions: jest
    .fn()
    .mockResolvedValue([{ subscriptionOfferDetails: [{ offerToken: 'offer_1' }] }]),
  // Resolves without emitting; the test drives the captured listeners manually.
  requestSubscription: jest.fn().mockResolvedValue(undefined),
  finishTransaction: jest.fn().mockResolvedValue(true),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('../../services/api/subscriptionApi');

import * as iap from 'react-native-iap';
import { subscriptionApi } from '../../services/api/subscriptionApi';
import { useProPurchase } from '../useProPurchase';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (subscriptionApi.verifyGooglePurchase as jest.Mock).mockResolvedValue({
    plan: 'PRO',
    limits: {},
    features: {},
  });
});

describe('useProPurchase', () => {
  it('verifies the purchase and finishes the transaction on success', async () => {
    const { result } = renderHook(() => useProPurchase(), { wrapper: createWrapper() });

    act(() => {
      result.current.buy('pro_monthly');
    });

    // The hook registers the listener after init/getSubscriptions resolve.
    await waitFor(() => expect(iap.purchaseUpdatedListener as jest.Mock).toHaveBeenCalled());
    const onPurchase = (iap.purchaseUpdatedListener as jest.Mock).mock.calls[0][0];

    await act(async () => {
      onPurchase({ purchaseToken: 'gp_token_123', productId: 'pro_monthly' });
    });

    await waitFor(() =>
      expect(subscriptionApi.verifyGooglePurchase).toHaveBeenCalledWith(
        'pro_monthly',
        'gp_token_123'
      )
    );
    expect(iap.requestSubscription).toHaveBeenCalled();
    expect(iap.finishTransaction).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('¡Listo!', expect.stringContaining('Pro'));
  });

  it('does not surface an error when the user cancels', async () => {
    const { result } = renderHook(() => useProPurchase(), { wrapper: createWrapper() });

    act(() => {
      result.current.buy('pro_monthly');
    });

    await waitFor(() => expect(iap.purchaseErrorListener as jest.Mock).toHaveBeenCalled());
    const onError = (iap.purchaseErrorListener as jest.Mock).mock.calls[0][0];

    await act(async () => {
      onError({ code: 'E_USER_CANCELLED' });
    });

    await waitFor(() => expect(result.current.purchasing).toBeNull());
    expect(subscriptionApi.verifyGooglePurchase).not.toHaveBeenCalled();
    expect(iap.finishTransaction).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
