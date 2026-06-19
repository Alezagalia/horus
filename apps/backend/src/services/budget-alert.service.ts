/**
 * Budget Alert Service
 * F-01 - Alertas push de presupuesto al 80% y 100%
 *
 * Se dispara tras crear/editar una transacción de egreso. Recalcula el gasto
 * del presupuesto (categoría + moneda) para el mes de la transacción y, si se
 * cruza un umbral (80% o 100%) que aún no fue notificado ese mes, envía un push.
 *
 * Anti-spam: cada umbral se notifica una sola vez por presupuesto/mes, usando
 * una dedupKey persistida en Notification.data (no requiere migración de schema).
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { sendToUser } from './push/push-notification.service.js';

const NOTIFICATION_TYPE = 'budget_alert';
// Umbrales en orden descendente: solo se notifica el más alto que se haya cruzado.
const THRESHOLDS = [100, 80] as const;

interface CheckBudgetThresholdInput {
  userId: string;
  categoryId: string;
  currency: string;
  /** Fecha de la transacción que disparó el chequeo. */
  date: Date;
}

/** Formatea un monto con su moneda; cae a "<ISO> <monto>" si el código no es válido. */
function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Recalcula el gasto del presupuesto y envía alerta push si corresponde.
 * Diseñada para llamarse "fire-and-forget": captura sus propios errores y nunca
 * lanza, para no afectar el flujo de la transacción que la dispara.
 */
export async function checkBudgetThreshold(input: CheckBudgetThresholdInput): Promise<void> {
  const { userId, categoryId, currency, date } = input;

  try {
    const month = date.getMonth() + 1; // 1-indexed
    const year = date.getFullYear();

    // 1. Presupuesto activo para esta categoría + moneda
    const budget = await prisma.budget.findFirst({
      where: { userId, categoryId, currency, isActive: true },
      include: { category: { select: { name: true } } },
    });

    if (!budget) return; // sin presupuesto, no hay nada que alertar

    const amount = parseFloat(budget.amount.toString());
    if (amount <= 0) return;

    // 2. Gasto del mes para esta categoría + moneda (misma lógica que el summary)
    const result = await prisma.$queryRaw<[{ spent: string }]>`
      SELECT COALESCE(SUM(t.amount), 0) AS spent
      FROM transactions t
      JOIN accounts a ON t."accountId" = a.id
      WHERE t."userId" = ${userId}
        AND t."categoryId" = ${categoryId}
        AND t.type = 'egreso'
        AND t."isTransfer" = false
        AND a.currency = ${currency}
        AND EXTRACT(MONTH FROM t.date) = ${month}
        AND EXTRACT(YEAR FROM t.date) = ${year}
    `;

    const spent = parseFloat(result[0]?.spent ?? '0');
    const percentage = Math.round((spent / amount) * 100);

    // 3. Umbral más alto cruzado
    const threshold = THRESHOLDS.find((t) => percentage >= t);
    if (!threshold) return; // todavía por debajo del 80%

    // 4. Anti-duplicado: ¿ya notificamos este umbral para este presupuesto/mes?
    const dedupKey = `budget:${budget.id}:${year}-${month}:${threshold}`;
    const alreadySent = await prisma.notification.findFirst({
      where: { userId, type: NOTIFICATION_TYPE, data: { contains: dedupKey } },
      select: { id: true },
    });
    if (alreadySent) return;

    // 5. Construir y enviar la alerta
    const categoryName = budget.category.name;
    const spentStr = formatMoney(spent, currency);
    const amountStr = formatMoney(amount, currency);

    const { title, body } =
      threshold >= 100
        ? {
            title: '🚨 Presupuesto superado',
            body: `Superaste tu presupuesto de ${categoryName}: ${spentStr} de ${amountStr} (${percentage}%).`,
          }
        : {
            title: '⚠️ Presupuesto al 80%',
            body: `Llevás ${spentStr} de ${amountStr} en ${categoryName} (${percentage}%). Cuidá el resto del mes.`,
          };

    const dataPayload = {
      type: NOTIFICATION_TYPE,
      dedupKey,
      budgetId: budget.id,
      categoryId,
      categoryName,
      currency,
      threshold: String(threshold),
      percentage: String(percentage),
      month: String(month),
      year: String(year),
    };

    const pushResult = await sendToUser({ userId, title, body, data: dataPayload });

    // 6. Persistir la notificación (también sirve de registro anti-spam)
    await prisma.notification.create({
      data: {
        userId,
        type: NOTIFICATION_TYPE,
        title,
        body,
        data: JSON.stringify(dataPayload),
        pushSent: pushResult.success,
        pushSentAt: pushResult.success ? new Date() : null,
        pushError: pushResult.errors.length > 0 ? pushResult.errors.join(', ') : null,
      },
    });

    logger.info(
      `Budget alert (${threshold}%) enviada a user ${userId} para categoría ${categoryName} [${percentage}%]`
    );
  } catch (error) {
    logger.error('Error en checkBudgetThreshold:', error);
  }
}
