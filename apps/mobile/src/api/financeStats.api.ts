/**
 * Finance Statistics API Service
 * Sprint 9 - US-078
 *
 * API client for finance statistics endpoints
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient } from '../lib/axios';

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  ingresos: number;
  egresos: number;
  balance: number;
}

export interface AccountSummary {
  accountId: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  currency: string;
}

export interface FinanceStatsResponse {
  period: {
    month: number;
    year: number;
  };
  totals: {
    totalIngresos: number;
    totalEgresos: number;
    balance: number;
  };
  porCategoria: CategoryStats[];
  evolucionMensual: MonthlyStats[];
  cuentasResumen: AccountSummary[];
}

/**
 * Get finance statistics for a specific month/year
 * Defaults to current month if not provided
 */
export const getFinanceStats = async (
  month?: number,
  year?: number
): Promise<FinanceStatsResponse> => {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());

  const response = await apiClient.get<FinanceStatsResponse>(`/finance/stats?${params.toString()}`);
  return response.data;
};
