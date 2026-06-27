/**
 * Google Play subscription product ids (S-05).
 *
 * These MUST match both:
 *  - the subscription product ids created in Google Play Console, and
 *  - the backend env vars GOOGLE_PLAY_PRODUCT_PRO_MONTHLY / _ANNUAL.
 *
 * Overridable via EXPO_PUBLIC_* env at build time; the defaults are the
 * conventional ids we document in the setup guide.
 */
export const PRO_PRODUCTS = {
  monthly: process.env.EXPO_PUBLIC_IAP_PRO_MONTHLY ?? 'pro_monthly',
  annual: process.env.EXPO_PUBLIC_IAP_PRO_ANNUAL ?? 'pro_annual',
} as const;

export type ProInterval = keyof typeof PRO_PRODUCTS;
