import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Account as AccountModel } from './models/Account';
import { Category as CategoryModel } from './models/Category';
import { Transaction as TransactionModel } from './models/Transaction';
import { RecurringExpense as RecurringExpenseModel } from './models/RecurringExpense';
import { MonthlyExpenseInstance as MonthlyExpenseInstanceModel } from './models/MonthlyExpenseInstance';
import { Budget as BudgetModel } from './models/Budget';
import { SavingsGoal as SavingsGoalModel } from './models/SavingsGoal';
import type { Account, AccountType } from '@/services/api/accountApi';
import type {
  Transaction,
  TransactionListResult,
  TransactionType,
} from '@/services/api/transactionApi';
import type {
  Category,
  RecurringExpense,
  MonthlyExpense,
  MonthlyExpensesResponse,
  BudgetsResponse,
  BudgetsSummaryResponse,
  SavingsGoalsResponse,
  Scope,
} from '@horus/shared';

/**
 * Lecturas locales del dominio Dinero. Cada loader devuelve EXACTAMENTE el
 * shape que devolvía la API REST correspondiente, para que los hooks
 * mantengan su contrato con las pantallas. Los filtros/orden espejan los
 * services del backend (active-only, createdAt desc, etc.).
 */

const collections = {
  accounts: () => database.get<AccountModel>('accounts'),
  categories: () => database.get<CategoryModel>('categories'),
  transactions: () => database.get<TransactionModel>('transactions'),
  recurring: () => database.get<RecurringExpenseModel>('recurring_expenses'),
  instances: () => database.get<MonthlyExpenseInstanceModel>('monthly_expense_instances'),
  budgets: () => database.get<BudgetModel>('budgets'),
  savingsGoals: () => database.get<SavingsGoalModel>('savings_goals'),
};

function toApiAccount(a: AccountModel): Account {
  return {
    id: a.id,
    name: a.name,
    type: a.type as AccountType,
    balance: a.balance,
    initialBalance: a.initialBalance,
    currency: a.currency,
    icon: a.icon,
    color: a.color,
    isActive: a.isActive,
  };
}

function toApiCategory(c: CategoryModel): Category {
  return {
    id: c.id,
    userId: '',
    name: c.name,
    scope: c.scope as Scope,
    icon: c.icon ?? null,
    color: c.color ?? null,
    isDefault: c.isDefault,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  } as Category;
}

async function categoryMap(): Promise<Map<string, CategoryModel>> {
  const rows = await collections.categories().query().fetch();
  return new Map(rows.map((c) => [c.id, c]));
}

async function accountMap(): Promise<Map<string, AccountModel>> {
  const rows = await collections.accounts().query().fetch();
  return new Map(rows.map((a) => [a.id, a]));
}

// ---------------------------------------------------------------------------
// Accounts (GET /accounts)
// ---------------------------------------------------------------------------

export async function listAccountsLocal(): Promise<{
  accounts: Account[];
  totalBalanceByCurrency: Record<string, number>;
}> {
  const rows = await collections
    .accounts()
    .query(Q.where('is_active', true), Q.sortBy('created_at', Q.desc))
    .fetch();

  const totalBalanceByCurrency: Record<string, number> = {};
  for (const a of rows) {
    totalBalanceByCurrency[a.currency] = (totalBalanceByCurrency[a.currency] ?? 0) + a.balance;
  }
  return { accounts: rows.map(toApiAccount), totalBalanceByCurrency };
}

// ---------------------------------------------------------------------------
// Categories de dinero (GET /categories?scope=...)
// ---------------------------------------------------------------------------

export async function listCategoriesLocal(scope?: string): Promise<Category[]> {
  const clauses = [Q.where('is_active', true)];
  if (scope) clauses.push(Q.where('scope', scope));
  const rows = await collections
    .categories()
    .query(...clauses)
    .fetch();
  // Orden REST: isDefault desc, name asc
  rows.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
  return rows.map(toApiCategory);
}

// ---------------------------------------------------------------------------
// Transactions (GET /transactions)
// ---------------------------------------------------------------------------

export async function listTransactionsLocal(filters?: {
  accountId?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<TransactionListResult> {
  const where = [];
  if (filters?.accountId) where.push(Q.where('account_id', filters.accountId));
  if (filters?.type) where.push(Q.where('type', filters.type));
  if (filters?.from) where.push(Q.where('date', Q.gte(new Date(filters.from).getTime())));
  if (filters?.to) where.push(Q.where('date', Q.lte(new Date(filters.to).getTime())));

  const all = await collections
    .transactions()
    .query(...where, Q.sortBy('date', Q.desc))
    .fetch();

  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? all.length;
  const page = all.slice(offset, offset + limit);

  const [accounts, categories] = await Promise.all([accountMap(), categoryMap()]);

  const transactions: Transaction[] = page.map((t) => {
    const account = accounts.get(t.accountId);
    const category = categories.get(t.categoryId);
    return {
      id: t.id,
      accountId: t.accountId,
      categoryId: t.categoryId,
      type: t.type as TransactionType,
      amount: t.amount,
      concept: t.concept,
      date: t.date.toISOString(),
      notes: t.notes ?? undefined,
      isTransfer: t.isTransfer,
      createdAt: t.createdAt.toISOString(),
      account: {
        id: t.accountId,
        name: account?.name ?? '',
        type: account?.type ?? '',
        currency: account?.currency ?? 'ARS',
        color: account?.color,
        icon: account?.icon,
      },
      category: {
        id: t.categoryId,
        name: category?.name ?? '',
        icon: category?.icon,
        color: category?.color,
      },
    };
  });

  // Totales sobre TODO el set filtrado (como la API), no solo la página
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of all) {
    if (t.type === 'ingreso') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }

  return {
    transactions,
    pagination: {
      total: all.length,
      limit,
      offset,
      hasMore: offset + page.length < all.length,
    },
    totals: { totalIncome, totalExpenses, balance: totalIncome - totalExpenses },
  };
}

// ---------------------------------------------------------------------------
// Recurring expenses (GET /recurring-expenses)
// ---------------------------------------------------------------------------

export async function listRecurringExpensesLocal(
  activeOnly?: boolean
): Promise<RecurringExpense[]> {
  const clauses = activeOnly ? [Q.where('is_active', true)] : [];
  const rows = await collections
    .recurring()
    .query(...clauses, Q.sortBy('created_at', Q.desc))
    .fetch();
  const categories = await categoryMap();

  return rows.map((r) => {
    const category = categories.get(r.categoryId);
    return {
      id: r.id,
      userId: '',
      concept: r.concept,
      categoryId: r.categoryId,
      currency: r.currency,
      dueDay: r.dueDay ?? null,
      notes: r.notes ?? null,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      category: category ? toApiCategory(category) : undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Monthly expenses (GET /monthly-expenses/:month/:year)
// ---------------------------------------------------------------------------

export async function listMonthlyExpensesLocal(
  month: number,
  year: number
): Promise<MonthlyExpensesResponse> {
  const rows = await collections
    .instances()
    .query(Q.where('month', month), Q.where('year', year))
    .fetch();

  const [recurringRows, categories, accounts] = await Promise.all([
    collections.recurring().query().fetch(),
    categoryMap(),
    accountMap(),
  ]);
  const recurringById = new Map(recurringRows.map((r) => [r.id, r]));

  // La API solo lista instancias de plantillas activas
  const visible = rows.filter((m) => recurringById.get(m.recurringExpenseId)?.isActive !== false);

  // Orden REST: pendiente primero, luego concept asc
  visible.sort(
    (a, b) =>
      Number(a.status === 'pagado') - Number(b.status === 'pagado') ||
      a.concept.localeCompare(b.concept)
  );

  const monthlyExpenses: MonthlyExpense[] = visible.map((m) => {
    const recurring = recurringById.get(m.recurringExpenseId);
    const category = categories.get(m.categoryId);
    const account = m.accountId ? accounts.get(m.accountId) : undefined;
    return {
      id: m.id,
      recurringExpenseId: m.recurringExpenseId,
      userId: '',
      month: m.month,
      year: m.year,
      concept: m.concept,
      categoryId: m.categoryId,
      amount: m.amount,
      previousAmount: m.previousAmount ?? null,
      status: m.status as MonthlyExpense['status'],
      accountId: m.accountId ?? null,
      paidDate: m.paidDate ? m.paidDate.toISOString() : null,
      notes: m.notes ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      recurringExpense: recurring
        ? {
            id: recurring.id,
            userId: '',
            concept: recurring.concept,
            categoryId: recurring.categoryId,
            currency: recurring.currency,
            dueDay: recurring.dueDay ?? null,
            notes: recurring.notes ?? null,
            isActive: recurring.isActive,
            createdAt: recurring.createdAt.toISOString(),
            updatedAt: recurring.updatedAt.toISOString(),
          }
        : undefined,
      category: category ? toApiCategory(category) : undefined,
      account: account
        ? ({ id: account.id, name: account.name, icon: account.icon } as MonthlyExpense['account'])
        : undefined,
    };
  });

  return {
    message: 'ok',
    monthlyExpenses,
    count: monthlyExpenses.length,
    month,
    year,
  };
}

// ---------------------------------------------------------------------------
// Budgets (GET /budgets y /budgets/summary)
// ---------------------------------------------------------------------------

export async function listBudgetsLocal(): Promise<BudgetsResponse> {
  const rows = await collections
    .budgets()
    .query(Q.where('is_active', true), Q.sortBy('created_at', Q.desc))
    .fetch();
  const categories = await categoryMap();

  const budgets = rows.map((b) => {
    const category = categories.get(b.categoryId);
    return {
      id: b.id,
      userId: '',
      categoryId: b.categoryId,
      amount: b.amount,
      currency: b.currency,
      isActive: b.isActive,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      category: category
        ? {
            id: category.id,
            name: category.name,
            icon: category.icon ?? null,
            color: category.color ?? null,
          }
        : undefined,
    };
  });

  return { message: 'ok', budgets, count: budgets.length } as BudgetsResponse;
}

/** Espejo de budget.service.getBudgetsSummary: suma egresos (no transferencias)
 * del mes por categoría, en cuentas de la misma moneda del presupuesto. */
export async function budgetsSummaryLocal(
  month: number,
  year: number
): Promise<BudgetsSummaryResponse> {
  const { budgets } = await listBudgetsLocal();
  const monthStart = new Date(year, month - 1, 1).getTime();
  const monthEnd = new Date(year, month, 1).getTime();

  const [txRows, accounts] = await Promise.all([
    collections
      .transactions()
      .query(
        Q.where('type', 'egreso'),
        Q.where('is_transfer', false),
        Q.where('date', Q.gte(monthStart)),
        Q.where('date', Q.lt(monthEnd))
      )
      .fetch(),
    accountMap(),
  ]);

  const summary = budgets.map((budget) => {
    let spent = 0;
    for (const t of txRows) {
      if (t.categoryId !== budget.categoryId) continue;
      if (accounts.get(t.accountId)?.currency !== budget.currency) continue;
      spent += t.amount;
    }
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    return { ...budget, spent, remaining, percentage };
  });

  return { message: 'ok', summary, month, year } as BudgetsSummaryResponse;
}

// ---------------------------------------------------------------------------
// Savings goals (GET /savings-goals)
// ---------------------------------------------------------------------------

export async function listSavingsGoalsLocal(): Promise<SavingsGoalsResponse> {
  const rows = await collections
    .savingsGoals()
    .query(Q.where('is_active', true), Q.sortBy('created_at', Q.desc))
    .fetch();
  const accounts = await accountMap();

  const savingsGoals = rows.map((g) => {
    const account = accounts.get(g.accountId);
    const savedAmount = account?.balance ?? 0;
    const remaining = g.targetAmount - savedAmount;
    const progress = g.targetAmount > 0 ? Math.min((savedAmount / g.targetAmount) * 100, 100) : 0;
    return {
      id: g.id,
      userId: '',
      accountId: g.accountId,
      name: g.name,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate ? g.targetDate.toISOString() : null,
      notes: g.notes ?? null,
      status: g.status,
      isActive: g.isActive,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      account: {
        id: g.accountId,
        name: account?.name ?? '',
        icon: account?.icon ?? '🏦',
        color: account?.color ?? '#3B82F6',
        currency: account?.currency ?? 'ARS',
        currentBalance: savedAmount,
      },
      savedAmount,
      remaining,
      progress,
    };
  });

  return {
    message: 'ok',
    savingsGoals,
    count: savingsGoals.length,
  } as SavingsGoalsResponse;
}
