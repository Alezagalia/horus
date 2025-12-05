/**
 * Monthly Expense Generation Service
 * Sprint 10 - US-093 (TECH-001)
 *
 * Service for automatic generation of monthly expense instances
 */

import { prisma } from '../lib/prisma.js';

/**
 * Result of monthly expense generation
 */
export interface GenerationResult {
  created: number;
  skipped: number;
  errors: number;
  month: number;
  year: number;
}

/**
 * Generate monthly expense instances for all active recurring expenses
 * This function is idempotent - it will not create duplicates if run multiple times for the same month
 *
 * @param month - Month (1-12)
 * @param year - Year (e.g. 2024)
 * @returns Result with counts of created, skipped and errors
 */
export async function generateMonthlyExpenses(
  month: number,
  year: number
): Promise<GenerationResult> {
  console.log(`[CRON] Iniciando generación de gastos mensuales para ${month}/${year}`);

  // 1. Obtener todos los gastos recurrentes activos
  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { isActive: true },
  });

  console.log(`[CRON] Encontrados ${recurringExpenses.length} gastos recurrentes activos`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const expense of recurringExpenses) {
    try {
      // 2. Verificar si ya existe instancia para este mes
      const existing = await prisma.monthlyExpenseInstance.findFirst({
        where: {
          recurringExpenseId: expense.id,
          month,
          year,
        },
      });

      if (existing) {
        console.log(
          `[CRON] Instancia ya existe para gasto ${expense.id} (${expense.concept}) - ${month}/${year}`
        );
        skipped++;
        continue; // Ya existe, skip
      }

      // 3. Buscar instancia del mes anterior para previousAmount
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;

      const previousInstance = await prisma.monthlyExpenseInstance.findFirst({
        where: {
          recurringExpenseId: expense.id,
          month: previousMonth,
          year: previousYear,
          status: 'pagado', // Solo considerar si fue pagado
        },
      });

      const previousAmount = previousInstance?.amount || 0;

      // 4. Crear nueva instancia
      const newInstance = await prisma.monthlyExpenseInstance.create({
        data: {
          recurringExpenseId: expense.id,
          userId: expense.userId,
          month,
          year,
          concept: expense.concept,
          categoryId: expense.categoryId,
          amount: 0, // Siempre 0 hasta que se pague
          previousAmount,
          status: 'pendiente',
        },
      });

      console.log(
        `[CRON] Creada instancia ${newInstance.id} para gasto ${expense.id} (${expense.concept}) - ${month}/${year} (previousAmount: ${previousAmount})`
      );
      created++;
    } catch (error) {
      console.error(`[CRON] Error procesando gasto ${expense.id} (${expense.concept}):`, error);
      errors++;
      // Continuar con el siguiente
    }
  }

  const result: GenerationResult = {
    created,
    skipped,
    errors,
    month,
    year,
  };

  console.log(
    `[CRON] Finalizado para ${month}/${year}: ${created} creados, ${skipped} omitidos, ${errors} errores`
  );

  return result;
}

/**
 * Generate monthly expense instances for a specific user
 * Called on-demand when user accesses monthly expenses page
 *
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year (e.g. 2024)
 * @returns Result with counts of created, skipped and errors
 */
export async function generateMonthlyExpensesForUser(
  userId: string,
  month: number,
  year: number
): Promise<GenerationResult> {
  // 1. Get active recurring expenses for this user only
  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: {
      userId,
      isActive: true
    },
  });

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const expense of recurringExpenses) {
    try {
      // 2. Check if instance already exists for this month
      const existing = await prisma.monthlyExpenseInstance.findFirst({
        where: {
          recurringExpenseId: expense.id,
          month,
          year,
        },
      });

      if (existing) {
        skipped++;
        continue; // Already exists, skip
      }

      // 3. Find previous month's instance for previousAmount
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;

      const previousInstance = await prisma.monthlyExpenseInstance.findFirst({
        where: {
          recurringExpenseId: expense.id,
          month: previousMonth,
          year: previousYear,
          status: 'pagado',
        },
      });

      const previousAmount = previousInstance?.amount || 0;

      // 4. Create new instance
      await prisma.monthlyExpenseInstance.create({
        data: {
          recurringExpenseId: expense.id,
          userId: expense.userId,
          month,
          year,
          concept: expense.concept,
          categoryId: expense.categoryId,
          amount: 0,
          previousAmount,
          status: 'pendiente',
        },
      });

      created++;
    } catch (error) {
      console.error(`Error generating monthly expense for ${expense.id}:`, error);
      errors++;
    }
  }

  return {
    created,
    skipped,
    errors,
    month,
    year,
  };
}
