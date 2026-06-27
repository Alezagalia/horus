/**
 * useProPurchase (S-05)
 *
 * Drives the Google Play in-app purchase flow for the Pro subscription, then
 * hands the purchase token to the backend for server-side verification.
 *
 * react-native-iap is a native module, so it is NOT available in Expo Go. We
 * require it lazily and degrade gracefully (isIapAvailable) instead of crashing
 * during development.
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { Purchase } from 'react-native-iap';
import { subscriptionKeys } from './useSubscription';
import { subscriptionApi } from '@/services/api/subscriptionApi';
import { apiErrorMessage } from '@/lib/apiError';

type IapModule = typeof import('react-native-iap');

let iapModule: IapModule | null | undefined;
function getIap(): IapModule | null {
  if (iapModule !== undefined) return iapModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iapModule = require('react-native-iap');
  } catch {
    iapModule = null;
  }
  return iapModule ?? null;
}

/** Whether native IAP is present (false in Expo Go / web). */
export function isIapAvailable(): boolean {
  return getIap() != null;
}

export function useProPurchase() {
  const queryClient = useQueryClient();
  // Holds the productId currently being purchased (for per-button spinners).
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const buy = useCallback(
    async (productId: string) => {
      const iap = getIap();
      if (!iap) {
        Alert.alert('No disponible', 'Las compras requieren la app instalada desde Google Play.');
        return;
      }

      setPurchasing(productId);
      let updateSub: { remove: () => void } | undefined;
      let errorSub: { remove: () => void } | undefined;

      try {
        await iap.initConnection();
        // Clears stuck pending purchases from a previous crashed attempt.
        await iap.flushFailedPurchasesCachedAsPendingAndroid?.();

        // Android subscriptions require selecting an offer token from the product.
        const subs = await iap.getSubscriptions({ skus: [productId] });
        const offerToken = (
          subs?.[0] as { subscriptionOfferDetails?: Array<{ offerToken?: string }> } | undefined
        )?.subscriptionOfferDetails?.[0]?.offerToken;

        const purchase = await new Promise<Purchase>((resolve, reject) => {
          updateSub = iap.purchaseUpdatedListener((p) => resolve(p));
          errorSub = iap.purchaseErrorListener((e) => reject(e));
          iap
            .requestSubscription({
              sku: productId,
              ...(offerToken ? { subscriptionOffers: [{ sku: productId, offerToken }] } : {}),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
            .catch(reject);
        });

        const purchaseToken = purchase.purchaseToken;
        if (!purchaseToken) throw new Error('La compra no devolvió un token.');

        // Server validates with Google and upserts our Subscription → Pro.
        await subscriptionApi.verifyGooglePurchase(productId, purchaseToken);

        // Acknowledge/consume so Google doesn't auto-refund.
        await iap.finishTransaction({ purchase, isConsumable: false });

        await queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine });
        Alert.alert('¡Listo!', 'Tu plan Pro ya está activo 🎉');
      } catch (e) {
        const code = (e as { code?: string })?.code;
        // User backed out of the Google payment sheet — not an error to surface.
        if (code !== 'E_USER_CANCELLED') {
          Alert.alert('Compra', apiErrorMessage(e, 'No se pudo completar la compra.'));
        }
      } finally {
        updateSub?.remove();
        errorSub?.remove();
        setPurchasing(null);
      }
    },
    [queryClient]
  );

  return { buy, purchasing };
}
