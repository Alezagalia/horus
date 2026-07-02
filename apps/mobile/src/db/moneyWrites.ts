import { Q } from '@nozbe/watermelondb';
import * as Crypto from 'expo-crypto';
import { database } from './index';
import { requestSync } from './syncScheduler';
import { Account as AccountModel } from './models/Account';
import { Category as CategoryModel } from './models/Category';
import { Transaction as TransactionModel } from './models/Transaction';
import { RecurringExpense as RecurringExpenseModel } from './models/RecurringExpense';
import { MonthlyExpenseInstance as MonthlyExpenseInstanceModel } from './models/MonthlyExpenseInstance';
import { Budget as BudgetModel } from './models/Budget';
import { SavingsGoal as SavingsGoalModel } from './models/SavingsGoal';
import {
  ACCOUNT_TYPE_COLORS,
  ACCOUNT_TYPE_ICONS,
  type CreateAccountDTO,
  type UpdateAccountDTO,
} from '@/services/api/accountApi';
import type {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  CreateTransferDTO,
} from '@/services/api/transactionApi';
import type {
  PayMonthlyExpenseDTO,
  CreateRecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
  CreateBudgetDTO,
  UpdateBudgetDTO,
  CreateSavingsGoalDTO,
  UpdateSavingsGoalDTO,
} from '@horus/shared';

/**
 * Escrituras locales del dominio Dinero (offline-first). Cada operación:
 *  1. escribe SQLite en un batch atómico (Watermelon marca las filas dirty),
 *  2. ajusta `balance` localmente con los MISMOS deltas que el server
 *     (ajuste optimista; el pull lo corrige si difiere),
 *  3. dispara `requestSync()` (push debounced al backend).
 * El server re-valida todo en el push (invariantes, ownership, claims).
 */

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function txDelta(type: string, amount: number): number {
  return round2(type === 'ingreso' ? amount : -amount);
}

const accounts = () => database.get<AccountModel>('accounts');
const categories = () => database.get<CategoryModel>('categories');
const transactions = () => database.get<TransactionModel>('transactions');
const recurring = () => database.get<RecurringExpenseModel>('recurring_expenses');
const instances = () => database.get<MonthlyExpenseInstanceModel>('monthly_expense_instances');
const budgets = () => database.get<BudgetModel>('budgets');
const savingsGoals = () => database.get<SavingsGoalModel>('savings_goals');

async function adjustBalance(accountId: string, delta: number): Promise<void> {
  if (delta === 0) return;
  const account = await accounts().find(accountId);
  await account.update((a) => {
    a.balance = round2(a.balance + delta);
  });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function createAccountLocal(dto: CreateAccountDTO): Promise<void> {
  await database.write(async () => {
    await accounts().create((a) => {
      a.name = dto.name;
      a.type = dto.type;
      a.currency = dto.currency;
      a.balance = round2(dto.initialBalance);
      a.initialBalance = round2(dto.initialBalance);
      a.color = dto.color ?? ACCOUNT_TYPE_COLORS[dto.type];
      a.icon = ACCOUNT_TYPE_ICONS[dto.type];
      a.isActive = true;
    });
  });
  requestSync();
}

export async function updateAccountLocal(id: string, dto: UpdateAccountDTO): Promise<void> {
  await database.write(async () => {
    const account = await accounts().find(id);
    // Cambiar el balance inicial desplaza el balance actual por la diferencia
    // (misma semántica que el PUT REST y que el push del server)
    const initialDiff =
      dto.initialBalance !== undefined ? round2(dto.initialBalance - account.initialBalance) : 0;
    await account.update((a) => {
      if (dto.name !== undefined) a.name = dto.name;
      if (dto.currency !== undefined) a.currency = dto.currency;
      if (dto.initialBalance !== undefined) {
        a.initialBalance = round2(dto.initialBalance!);
        a.balance = round2(a.balance + initialDiff);
      }
    });
  });
  requestSync();
}

export async function deactivateAccountLocal(id: string): Promise<void> {
  await database.write(async () => {
    // Igual que el REST: no se desactiva una cuenta con transacciones
    const txCount = await transactions().query(Q.where('account_id', id)).fetchCount();
    if (txCount > 0) {
      throw new Error('No se puede desactivar una cuenta con transacciones');
    }
    const account = await accounts().find(id);
    await account.update((a) => {
      a.isActive = false;
    });
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function createTransactionLocal(dto: CreateTransactionDTO): Promise<void> {
  await database.write(async () => {
    await transactions().create((t) => {
      t.accountId = dto.accountId;
      t.categoryId = dto.categoryId;
      t.type = dto.type;
      t.amount = round2(dto.amount);
      t.concept = dto.concept;
      t.date = new Date(dto.date);
      t.notes = dto.notes;
      t.isTransfer = false;
    });
    await adjustBalance(dto.accountId, txDelta(dto.type, dto.amount));
  });
  requestSync();
}

export async function updateTransactionLocal(id: string, dto: UpdateTransactionDTO): Promise<void> {
  await database.write(async () => {
    const tx = await transactions().find(id);
    const oldAmount = tx.amount;
    const newAmount = dto.amount !== undefined ? round2(dto.amount) : oldAmount;

    const applyShared = (t: TransactionModel) => {
      if (dto.amount !== undefined) t.amount = newAmount;
      if (dto.concept !== undefined) t.concept = dto.concept;
      if (dto.date !== undefined) t.date = new Date(dto.date);
      if (dto.notes !== undefined) t.notes = dto.notes ?? undefined;
    };

    if (tx.isTransfer) {
      // Espejo de updateTransfer: sincroniza ambas patas y ajusta ambos saldos
      const pair = tx.transferPairId
        ? await transactions()
            .find(tx.transferPairId)
            .catch(() => null)
        : null;
      if (newAmount !== oldAmount) {
        await adjustBalance(
          tx.accountId,
          -txDelta(tx.type, oldAmount) + txDelta(tx.type, newAmount)
        );
        if (pair) {
          await adjustBalance(
            pair.accountId,
            -txDelta(pair.type, oldAmount) + txDelta(pair.type, newAmount)
          );
        }
      }
      await tx.update(applyShared);
      if (pair) await pair.update(applyShared);
    } else {
      if (newAmount !== oldAmount) {
        await adjustBalance(
          tx.accountId,
          -txDelta(tx.type, oldAmount) + txDelta(tx.type, newAmount)
        );
      }
      await tx.update((t) => {
        applyShared(t);
        if (dto.categoryId !== undefined) t.categoryId = dto.categoryId;
      });
    }
  });
  requestSync();
}

export async function deleteTransactionLocal(id: string): Promise<void> {
  await database.write(async () => {
    const tx = await transactions().find(id);
    await adjustBalance(tx.accountId, -txDelta(tx.type, tx.amount));

    if (tx.isTransfer && tx.transferPairId) {
      const pair = await transactions()
        .find(tx.transferPairId)
        .catch(() => null);
      if (pair) {
        await adjustBalance(pair.accountId, -txDelta(pair.type, pair.amount));
        await pair.markAsDeleted();
      }
    }
    await tx.markAsDeleted();
  });
  requestSync();
}

/** Categoría interna "Transferencias" (misma convención que el server; si acá
 * no existe se crea local y el push la dedupe por nombre). */
async function resolveTransferCategoryLocal(): Promise<string> {
  const found = await categories()
    .query(Q.where('name', 'Transferencias'), Q.where('scope', 'egresos'))
    .fetch();
  if (found.length > 0) return found[0].id;
  const created = await categories().create((c) => {
    c.name = 'Transferencias';
    c.scope = 'egresos';
    c.icon = 'swap-horizontal';
    c.color = '#6B7280';
    c.isDefault = false;
    c.isActive = true;
  });
  return created.id;
}

export async function createTransferLocal(dto: CreateTransferDTO): Promise<void> {
  await database.write(async () => {
    const categoryId = await resolveTransferCategoryLocal();
    const egresoId = Crypto.randomUUID();
    const ingresoId = Crypto.randomUUID();
    const amount = round2(dto.amount);
    const date = new Date(dto.date);

    await transactions().create((t) => {
      t._raw.id = egresoId;
      t.accountId = dto.fromAccountId;
      t.categoryId = categoryId;
      t.type = 'egreso';
      t.amount = amount;
      t.concept = dto.concept;
      t.date = date;
      t.notes = dto.notes;
      t.isTransfer = true;
      t.targetAccountId = dto.toAccountId;
      t.transferPairId = ingresoId;
    });
    await transactions().create((t) => {
      t._raw.id = ingresoId;
      t.accountId = dto.toAccountId;
      t.categoryId = categoryId;
      t.type = 'ingreso';
      t.amount = amount;
      t.concept = dto.concept;
      t.date = date;
      t.notes = dto.notes;
      t.isTransfer = true;
      t.targetAccountId = dto.fromAccountId;
      t.transferPairId = egresoId;
    });
    await adjustBalance(dto.fromAccountId, -amount);
    await adjustBalance(dto.toAccountId, amount);
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Monthly expenses (pagar / deshacer)
// ---------------------------------------------------------------------------

export async function payMonthlyExpenseLocal(id: string, dto: PayMonthlyExpenseDTO): Promise<void> {
  await database.write(async () => {
    const instance = await instances().find(id);
    if (instance.status === 'pagado') {
      throw new Error('El gasto ya está marcado como pagado');
    }
    const previousAmount = instance.amount;
    const paidDate = dto.paidDate ? new Date(dto.paidDate) : new Date();
    const amount = round2(dto.amount);

    await instance.update((m) => {
      m.status = 'pagado';
      m.amount = amount;
      m.previousAmount = previousAmount;
      m.accountId = dto.accountId;
      m.paidDate = paidDate;
      if (dto.notes !== undefined) m.notes = dto.notes;
    });

    const monthName = MONTH_NAMES[instance.month - 1];
    await transactions().create((t) => {
      t.accountId = dto.accountId;
      t.categoryId = instance.categoryId;
      t.type = 'egreso';
      t.amount = amount;
      t.concept = `${instance.concept} - ${monthName} ${instance.year}`;
      t.date = paidDate;
      t.notes = dto.notes;
      t.isTransfer = false;
      t.monthlyExpenseInstanceId = id;
    });
    await adjustBalance(dto.accountId, -amount);
  });
  requestSync();
}

export async function undoMonthlyExpensePaymentLocal(id: string): Promise<void> {
  await database.write(async () => {
    const instance = await instances().find(id);
    if (instance.status !== 'pagado') {
      throw new Error('Solo se pueden deshacer gastos pagados');
    }

    // Tx del pago: por vínculo explícito; fallback por concepto (pagos legacy)
    let payTx = (await transactions().query(Q.where('monthly_expense_instance_id', id)).fetch())[0];
    if (!payTx && instance.accountId) {
      const monthName = MONTH_NAMES[instance.month - 1];
      const concept = `${instance.concept} - ${monthName} ${instance.year}`;
      payTx = (
        await transactions()
          .query(
            Q.where('account_id', instance.accountId),
            Q.where('category_id', instance.categoryId),
            Q.where('concept', concept),
            Q.where('type', 'egreso')
          )
          .fetch()
      )[0];
    }

    if (payTx) {
      await adjustBalance(payTx.accountId, payTx.amount); // revertir egreso
      await payTx.markAsDeleted();
    }

    await instance.update((m) => {
      m.status = 'pendiente';
      m.accountId = undefined;
      m.paidDate = undefined;
      m.amount = m.previousAmount ?? 0;
    });
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Recurring expenses
// ---------------------------------------------------------------------------

export async function createRecurringExpenseLocal(dto: CreateRecurringExpenseDTO): Promise<void> {
  await database.write(async () => {
    await recurring().create((r) => {
      r.concept = dto.concept;
      r.categoryId = dto.categoryId;
      r.currency = dto.currency;
      r.dueDay = dto.dueDay ?? undefined;
      r.notes = dto.notes ?? undefined;
      r.isActive = true;
      r.lastReviewedAt = new Date();
    });
  });
  requestSync();
}

export async function updateRecurringExpenseLocal(
  id: string,
  dto: UpdateRecurringExpenseDTO
): Promise<void> {
  await database.write(async () => {
    const row = await recurring().find(id);
    await row.update((r) => {
      if (dto.concept !== undefined) r.concept = dto.concept;
      if (dto.categoryId !== undefined) r.categoryId = dto.categoryId;
      if (dto.currency !== undefined) r.currency = dto.currency;
      if (dto.dueDay !== undefined) r.dueDay = dto.dueDay ?? undefined;
      if (dto.notes !== undefined) r.notes = dto.notes ?? undefined;
    });
  });
  requestSync();
}

export async function deleteRecurringExpenseLocal(id: string): Promise<void> {
  await database.write(async () => {
    const row = await recurring().find(id);
    await row.update((r) => {
      r.isActive = false;
    });
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export async function createBudgetLocal(dto: CreateBudgetDTO): Promise<void> {
  await database.write(async () => {
    await budgets().create((b) => {
      b.categoryId = dto.categoryId;
      b.amount = round2(dto.amount);
      b.currency = dto.currency;
      b.isActive = true;
    });
  });
  requestSync();
}

export async function updateBudgetLocal(id: string, dto: UpdateBudgetDTO): Promise<void> {
  await database.write(async () => {
    const row = await budgets().find(id);
    await row.update((b) => {
      if (dto.amount !== undefined) b.amount = round2(dto.amount);
      if (dto.currency !== undefined) b.currency = dto.currency;
    });
  });
  requestSync();
}

export async function deleteBudgetLocal(id: string): Promise<void> {
  await database.write(async () => {
    const row = await budgets().find(id);
    await row.update((b) => {
      b.isActive = false;
    });
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Savings goals
// ---------------------------------------------------------------------------

export async function createSavingsGoalLocal(dto: CreateSavingsGoalDTO): Promise<void> {
  await database.write(async () => {
    await savingsGoals().create((g) => {
      g.accountId = dto.accountId;
      g.name = dto.name;
      g.targetAmount = round2(dto.targetAmount);
      g.targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;
      g.notes = dto.notes ?? undefined;
      g.status = 'en_progreso';
      g.isActive = true;
    });
  });
  requestSync();
}

export async function updateSavingsGoalLocal(id: string, dto: UpdateSavingsGoalDTO): Promise<void> {
  await database.write(async () => {
    const row = await savingsGoals().find(id);
    await row.update((g) => {
      if (dto.name !== undefined) g.name = dto.name;
      if (dto.targetAmount !== undefined) g.targetAmount = round2(dto.targetAmount);
      if (dto.targetDate !== undefined)
        g.targetDate = dto.targetDate ? new Date(dto.targetDate) : undefined;
      if (dto.notes !== undefined) g.notes = dto.notes ?? undefined;
      if (dto.status !== undefined) g.status = dto.status;
    });
  });
  requestSync();
}

export async function deleteSavingsGoalLocal(id: string): Promise<void> {
  await database.write(async () => {
    const row = await savingsGoals().find(id);
    await row.update((g) => {
      g.isActive = false;
    });
  });
  requestSync();
}
