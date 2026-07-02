/**
 * Replicación offline-first (WatermelonDB `synchronize()`) — Fase 1: dominio
 * Dinero completo (accounts, categories [scopes de dinero], transactions,
 * recurring_expenses, monthly_expense_instances, budgets, savings_goals).
 *
 * Contrato:
 *  - pull: { changes: { <tabla>: { created, updated, deleted } }, timestamp }
 *    (filas del userId con updatedAt > lastPulledAt; deleted = tombstones;
 *    snake_case; timestamps en ms). Si lastPulledAt es anterior al horizonte
 *    de retención de tombstones → { fullResyncRequired: true }.
 *  - push: aplica el batch completo en UNA transacción Prisma, idempotente por
 *    id de cliente, manteniendo las invariantes de dominio (saldos derivados,
 *    pares de transferencia, claim de pago mensual). Conflictos: LWW client-
 *    wins; excepciones: tombstone gana, claim gana.
 *
 * (Distinto de `/api/sync`, que es el sync de Google Calendar.)
 */

import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { createPushContext } from './push-context.js';
import { TOMBSTONE_RETENTION_DAYS } from './tombstone.service.js';
import { FullResyncResult, PullResult, PushChanges, TableChanges } from './types.js';
import * as accounts from './tables/account.replication.js';
import * as categories from './tables/category.replication.js';
import * as transactions from './tables/transaction.replication.js';
import * as recurringExpenses from './tables/recurringExpense.replication.js';
import * as monthlyExpenseInstances from './tables/monthlyExpenseInstance.replication.js';
import * as budgets from './tables/budget.replication.js';
import * as savingsGoals from './tables/savingsGoal.replication.js';

/** Límite de sanidad por tabla en el pull: con usuarios chicos no debería
 * alcanzarse nunca; si se alcanza, hay que implementar paginación. */
const PULL_SANITY_LIMIT = 10_000;

function splitByCreated<TModel extends { createdAt: Date }, TRaw>(
  rows: TModel[],
  lastPulledAt: number,
  toRaw: (row: TModel) => TRaw,
  deleted: string[]
): TableChanges<TRaw> {
  const created: TRaw[] = [];
  const updated: TRaw[] = [];
  for (const row of rows) {
    if (row.createdAt.getTime() > lastPulledAt) created.push(toRaw(row));
    else updated.push(toRaw(row));
  }
  return { created, updated, deleted };
}

export const replicationService = {
  async pull(userId: string, lastPulledAt: number): Promise<PullResult | FullResyncResult> {
    // Capturado ANTES de las queries: lo que se modifique mientras corre el pull
    // se re-entrega en el próximo (updated es idempotente en Watermelon).
    const timestamp = Date.now();

    // Cliente dormido más que la retención de tombstones: pudo perderse deletes
    // ya purgados → debe resetear su copia local y pullear desde 0.
    const retentionHorizon = timestamp - TOMBSTONE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    if (lastPulledAt > 0 && lastPulledAt < retentionHorizon) {
      return { fullResyncRequired: true, timestamp };
    }

    const since = new Date(lastPulledAt || 0);
    const changedWhere = { userId, updatedAt: { gt: since } };

    const [
      accountRows,
      categoryRows,
      transactionRows,
      recurringRows,
      instanceRows,
      budgetRows,
      goalRows,
      tombstones,
    ] = await Promise.all([
      prisma.account.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.category.findMany({
        where: { ...changedWhere, scope: { in: categories.MONEY_SCOPES } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.transaction.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.recurringExpense.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.monthlyExpenseInstance.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.budget.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.savingsGoal.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.replicationTombstone.findMany({
        where: { userId, deletedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
    ]);

    const rowCount =
      accountRows.length +
      categoryRows.length +
      transactionRows.length +
      recurringRows.length +
      instanceRows.length +
      budgetRows.length +
      goalRows.length;
    if (rowCount >= PULL_SANITY_LIMIT) {
      logger.warn(
        `[replication] pull de ${rowCount} filas para user ${userId}: evaluar paginación`
      );
    }

    const deletedByTable = new Map<string, string[]>();
    for (const t of tombstones) {
      const list = deletedByTable.get(t.tableName) ?? [];
      list.push(t.rowId);
      deletedByTable.set(t.tableName, list);
    }
    const deletedFor = (table: string): string[] => deletedByTable.get(table) ?? [];

    return {
      changes: {
        accounts: splitByCreated(accountRows, lastPulledAt, accounts.toRaw, deletedFor('accounts')),
        categories: splitByCreated(
          categoryRows,
          lastPulledAt,
          categories.toRaw,
          deletedFor('categories')
        ),
        transactions: splitByCreated(
          transactionRows,
          lastPulledAt,
          transactions.toRaw,
          deletedFor('transactions')
        ),
        recurring_expenses: splitByCreated(
          recurringRows,
          lastPulledAt,
          recurringExpenses.toRaw,
          deletedFor('recurring_expenses')
        ),
        monthly_expense_instances: splitByCreated(
          instanceRows,
          lastPulledAt,
          monthlyExpenseInstances.toRaw,
          deletedFor('monthly_expense_instances')
        ),
        budgets: splitByCreated(budgetRows, lastPulledAt, budgets.toRaw, deletedFor('budgets')),
        savings_goals: splitByCreated(
          goalRows,
          lastPulledAt,
          savingsGoals.toRaw,
          deletedFor('savings_goals')
        ),
      },
      timestamp,
    };
  },

  async push(userId: string, changes: PushChanges, lastPulledAt: number = 0): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const ctx = createPushContext(tx, userId, lastPulledAt);

      // Orden por FKs: cuentas y categorías primero; deletes de transactions
      // ANTES que sus creates/updates (revertir saldos primero).
      await accounts.applyCreated(ctx, changes.accounts?.created ?? []);
      await accounts.applyUpdated(ctx, changes.accounts?.updated ?? []);

      await categories.applyCreated(ctx, changes.categories?.created ?? []);
      await categories.applyUpdated(ctx, changes.categories?.updated ?? []);

      await recurringExpenses.applyCreated(ctx, changes.recurring_expenses?.created ?? []);
      await recurringExpenses.applyUpdated(ctx, changes.recurring_expenses?.updated ?? []);

      await budgets.applyCreated(ctx, changes.budgets?.created ?? []);
      await budgets.applyUpdated(ctx, changes.budgets?.updated ?? []);

      await savingsGoals.applyCreated(ctx, changes.savings_goals?.created ?? []);
      await savingsGoals.applyUpdated(ctx, changes.savings_goals?.updated ?? []);

      // Claims de pago antes que las transactions (pobla skippedInstanceIds)
      await monthlyExpenseInstances.applyCreated(
        ctx,
        changes.monthly_expense_instances?.created ?? []
      );
      await monthlyExpenseInstances.applyUpdated(
        ctx,
        changes.monthly_expense_instances?.updated ?? []
      );

      await transactions.applyDeleted(ctx, changes.transactions?.deleted ?? []);
      await transactions.applyCreated(ctx, changes.transactions?.created ?? []);
      await transactions.applyUpdated(ctx, changes.transactions?.updated ?? []);

      // deleted de tablas soft-delete no debería llegar
      for (const table of [
        'accounts',
        'categories',
        'recurring_expenses',
        'budgets',
        'savings_goals',
      ] as const) {
        const deleted = changes[table]?.deleted ?? [];
        if (deleted.length > 0) {
          logger.warn(
            `[replication] deleted de ${table} ignorado (soft delete via is_active): ${deleted.join(',')}`
          );
        }
      }
    });
  },
};
