/**
 * Currency Utilities
 * Sprint 9 - US-078
 *
 * Utilities for currency formatting and display
 */

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  ARS: '$',
  USD: 'US$',
  EUR: '€',
  BRL: 'R$',
  CLP: 'CLP$',
  COP: 'COL$',
  MXN: 'MX$',
  UYU: 'UY$',
  JPY: '¥',
  CNY: '¥',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  INR: '₹',
  GBP: '£',
};

/**
 * Get currency symbol from ISO code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Format number as currency with locale-specific formatting
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
  }
): string => {
  const { showSymbol = true, decimals = 2 } = options || {};

  // Format number with thousands separator and decimals
  const formattedNumber = amount.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (showSymbol) {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol} ${formattedNumber}`;
  }

  return formattedNumber;
};

/**
 * Format currency in compact form (1.2K, 1.5M, etc.)
 */
export const formatCurrencyCompact = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);

  if (Math.abs(amount) >= 1000000) {
    return `${symbol} ${(amount / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(amount) >= 1000) {
    return `${symbol} ${(amount / 1000).toFixed(1)}K`;
  }

  return `${symbol} ${amount.toFixed(0)}`;
};

/**
 * Get currency color for display
 * Returns a color based on common currency associations
 */
export const getCurrencyColor = (currencyCode: string): string => {
  const colors: Record<string, string> = {
    ARS: '#4A90E2', // Blue
    USD: '#50E3C2', // Green-blue
    EUR: '#7B68EE', // Medium purple
    BRL: '#FFB84D', // Orange
    // Add more as needed
  };

  return colors[currencyCode.toUpperCase()] || '#6B7280'; // Default gray
};
