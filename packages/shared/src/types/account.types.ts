/**
 * Account (Financial) Types
 * Sprint 13 - US-119
 */

export type AccountType = 'efectivo' | 'banco' | 'billetera_digital' | 'tarjeta';

export type Currency =
  | 'ARS'
  | 'USD'
  | 'EUR'
  | 'BRL'
  | 'CLP'
  | 'COP'
  | 'MXN'
  | 'UYU'
  | 'PEN'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'CHF'
  | 'CAD'
  | 'AUD'
  | 'NZD'
  | 'INR'
  | 'RUB';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDTO {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  color?: string;
  icon?: string;
}

export interface UpdateAccountDTO {
  name?: string;
  color?: string;
  icon?: string;
}

export interface FinanceStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: Currency;
}

export interface TotalBalanceByCurrency {
  currency: Currency;
  total: number;
}

// Account type metadata
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  efectivo: 'Efectivo',
  banco: 'Banco',
  billetera_digital: 'Billetera Digital',
  tarjeta: 'Tarjeta',
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  efectivo: '💵',
  banco: '🏦',
  billetera_digital: '📱',
  tarjeta: '💳',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  efectivo: '#10B981',
  banco: '#3B82F6',
  billetera_digital: '#8B5CF6',
  tarjeta: '#F59E0B',
};

// Currency metadata
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ARS: '$',
  USD: 'US$',
  EUR: '€',
  BRL: 'R$',
  CLP: '$',
  COP: '$',
  MXN: '$',
  UYU: '$',
  PEN: 'S/',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  INR: '₹',
  RUB: '₽',
};
