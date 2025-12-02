/**
 * Finance Statistics Service
 * Sprint 9 - US-077
 */

import { prisma } from '../lib/prisma.js';
import { TransactionType } from '../generated/prisma/client.js';

interface MonthlyStats {
  month: number;
  year: number;
  ingresos: number;
  egresos: number;
  balance: number;
}

interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  percentage: number;
}

interface AccountSummary {
  accountId: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  currency: string;
}

interface FinanceStatsResponse {
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

export const financeStatsService = {
  /**
   * Get finance statistics for a user
   * Includes monthly totals, category breakdown, 6-month evolution, and account summary
   */
  async getStats(userId: string, month?: number, year?: number): Promise<FinanceStatsResponse> {
    // Default to current month if not provided
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1; // 1-12
    const targetYear = year ?? now.getFullYear();

    // Calculate date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // 1. Get monthly totals (ingresos, egresos)
    const [ingresosAgg, egresosAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.ingreso,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.egreso,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalIngresos = Number(ingresosAgg._sum.amount || 0);
    const totalEgresos = Number(egresosAgg._sum.amount || 0);
    const balance = totalIngresos - totalEgresos;

    // 2. Get category breakdown (only for egresos)
    const categoryTransactions = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.egreso,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Fetch category details
    const categoryIds = categoryTransactions.map((ct) => ct.categoryId);
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const porCategoria: CategoryStats[] = categoryTransactions
      .map((ct) => {
        const category = categoryMap.get(ct.categoryId);
        const totalAmount = Number(ct._sum.amount || 0);
        const percentage = totalEgresos > 0 ? (totalAmount / totalEgresos) * 100 : 0;

        return {
          categoryId: ct.categoryId,
          categoryName: category?.name || 'Desconocida',
          categoryIcon: category?.icon || 'help-circle',
          categoryColor: category?.color || '#999999',
          totalAmount,
          percentage: Math.round(percentage * 100) / 100, // 2 decimals
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by amount descending

    // 3. Get 6-month evolution
    const evolucionMensual: MonthlyStats[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(targetYear, targetMonth - 1 - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const [monthIngresos, monthEgresos] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.ingreso,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.egreso,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const ingresos = Number(monthIngresos._sum.amount || 0);
      const egresos = Number(monthEgresos._sum.amount || 0);

      evolucionMensual.push({
        month,
        year,
        ingresos,
        egresos,
        balance: ingresos - egresos,
      });
    }

    // 4. Get account summary
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        currentBalance: true,
        currency: true,
      },
      orderBy: {
        currentBalance: 'desc',
      },
    });

    const cuentasResumen: AccountSummary[] = accounts.map((acc) => ({
      accountId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      currentBalance: Number(acc.currentBalance),
      currency: acc.currency,
    }));

    return {
      period: {
        month: targetMonth,
        year: targetYear,
      },
      totals: {
        totalIngresos,
        totalEgresos,
        balance,
      },
      porCategoria,
      evolucionMensual,
      cuentasResumen,
    };
  },
};
