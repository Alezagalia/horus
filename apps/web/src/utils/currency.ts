/**
 * Currency Formatting Utilities
 * Sprint 13 - US-119
 */

import type { Currency } from '@horus/shared';

const CURRENCY_LOCALES: Record<Currency, string> = {
  ARS: 'es-AR',
  USD: 'en-US',
  EUR: 'es-ES',
  BRL: 'pt-BR',
  CLP: 'es-CL',
  COP: 'es-CO',
  MXN: 'es-MX',
  UYU: 'es-UY',
  PEN: 'es-PE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  CHF: 'de-CH',
  CAD: 'en-CA',
  AUD: 'en-AU',
  NZD: 'en-NZ',
  INR: 'en-IN',
  RUB: 'ru-RU',
};

/**
 * Format amount with currency symbol
 * Uses Intl.NumberFormat for proper locale formatting
 */
export function formatCurrency(amount: number, currency?: Currency): string {
  // Default to ARS if currency is undefined
  const safeCurrency = currency || 'ARS';
  const locale = CURRENCY_LOCALES[safeCurrency] || 'es-AR';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format amount without currency symbol
 */
export function formatAmount(amount: number, currency?: Currency): string {
  const safeCurrency = currency || 'ARS';
  const locale = CURRENCY_LOCALES[safeCurrency] || 'es-AR';

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}
