/**
 * Admin Controller
 * Sprint 10 - US-093 (TECH-001)
 *
 * Admin endpoints for maintenance and manual operations
 */

import type { Request, Response } from 'express';
import { generateMonthlyExpenses } from '../services/monthlyExpenseGeneration.service.js';

/**
 * POST /api/admin/generate-monthly-expenses
 * Manually trigger generation of monthly expense instances
 * Query params:
 *   - month?: number (1-12, defaults to current month)
 *   - year?: number (defaults to current year)
 */
export const generateMonthlyExpensesManual = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string, 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : now.getFullYear();

    // Validate month and year
    if (month < 1 || month > 12) {
      res.status(400).json({
        error: 'Invalid month. Must be between 1 and 12.',
      });
      return;
    }

    if (year < 2000 || year > 2100) {
      res.status(400).json({
        error: 'Invalid year. Must be between 2000 and 2100.',
      });
      return;
    }

    console.log(`[ADMIN] Generación manual solicitada para ${month}/${year}`);

    const result = await generateMonthlyExpenses(month, year);

    res.status(200).json({
      message: 'Monthly expenses generation completed',
      result,
    });
  } catch (error) {
    console.error('[ADMIN] Error en generación manual:', error);
    res.status(500).json({
      error: 'Error generating monthly expenses',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
