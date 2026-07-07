import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    account: { findMany: vi.fn() },
    category: { findMany: vi.fn() },
    transaction: { findMany: vi.fn() },
    recurringExpense: { findMany: vi.fn() },
    monthlyExpenseInstance: { findMany: vi.fn() },
    budget: { findMany: vi.fn() },
    savingsGoal: { findMany: vi.fn() },
    habit: { findMany: vi.fn() },
    habitRecord: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
    taskChecklistItem: { findMany: vi.fn() },
    replicationTombstone: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../../lib/prisma.js';
import { replicationService } from './index.js';
import { PullResult } from './types.js';

const p = vi.mocked(prisma, true);

const USER_ID = 'b7e8a4f0-0000-4000-8000-000000000001';
const OLD = new Date('2026-06-01T00:00:00.000Z');
const NEW = new Date('2026-07-01T12:00:00.000Z');

function makeAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    userId: USER_ID,
    name: 'Efectivo',
    type: 'efectivo',
    currency: 'ARS',
    initialBalance: '1000',
    currentBalance: '1500.50', // Decimal simulado (Number() lo convierte)
    color: '#3B82F6',
    icon: '💵',
    isActive: true,
    createdAt: OLD,
    updatedAt: NEW,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  p.account.findMany.mockResolvedValue([]);
  p.category.findMany.mockResolvedValue([]);
  p.transaction.findMany.mockResolvedValue([]);
  p.recurringExpense.findMany.mockResolvedValue([]);
  p.monthlyExpenseInstance.findMany.mockResolvedValue([]);
  p.budget.findMany.mockResolvedValue([]);
  p.savingsGoal.findMany.mockResolvedValue([]);
  p.habit.findMany.mockResolvedValue([]);
  p.habitRecord.findMany.mockResolvedValue([]);
  p.task.findMany.mockResolvedValue([]);
  p.taskChecklistItem.findMany.mockResolvedValue([]);
  p.replicationTombstone.findMany.mockResolvedValue([]);
});

describe('replicationService.pull', () => {
  it('separa created (createdAt > lastPulledAt) de updated', async () => {
    const lastPulledAt = new Date('2026-06-15T00:00:00.000Z').getTime();
    p.account.findMany.mockResolvedValue([
      makeAccount({ id: 'acc-vieja', createdAt: OLD, updatedAt: NEW }) as any,
      makeAccount({ id: 'acc-nueva', createdAt: NEW, updatedAt: NEW }) as any,
    ]);

    const result = (await replicationService.pull(USER_ID, lastPulledAt)) as PullResult;
    const accounts = result.changes.accounts;

    expect(accounts.created).toHaveLength(1);
    expect((accounts.created![0] as { id: string }).id).toBe('acc-nueva');
    expect(accounts.updated).toHaveLength(1);
    expect((accounts.updated![0] as { id: string }).id).toBe('acc-vieja');
  });

  it('convierte Decimal a number y Date a ms (snake_case)', async () => {
    p.account.findMany.mockResolvedValue([makeAccount() as any]);

    const result = (await replicationService.pull(USER_ID, 0)) as PullResult;
    const raw = result.changes.accounts.created![0] as Record<string, unknown>;

    expect(raw.balance).toBe(1500.5);
    expect(raw.is_active).toBe(true);
    expect(raw.created_at).toBe(OLD.getTime());
    expect(raw.updated_at).toBe(NEW.getTime());
  });

  it('filtra categories a los scopes replicados (dinero + habitos + tareas)', async () => {
    await replicationService.pull(USER_ID, 0);

    const where = p.category.findMany.mock.calls[0][0]?.where as {
      scope: { in: string[] };
    };
    expect(where.scope.in).toEqual(
      expect.arrayContaining(['ingresos', 'egresos', 'gastos', 'habitos', 'tareas'])
    );
    expect(where.scope.in).toHaveLength(5);
  });

  it('incluye tasks y task_checklist_items en el pull (items filtrados vía su task)', async () => {
    p.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        userId: USER_ID,
        categoryId: 'cat-1',
        title: 'Comprar filtro',
        description: null,
        priority: 'media',
        status: 'pendiente',
        dueDate: NEW,
        completedAt: null,
        canceledAt: null,
        archivedAt: null,
        cancelReason: null,
        isActive: true,
        orderPosition: 2,
        rescheduleCount: 1,
        createdAt: OLD,
        updatedAt: NEW,
      },
    ] as any);
    p.taskChecklistItem.findMany.mockResolvedValue([
      {
        id: 'item-1',
        taskId: 'task-1',
        title: 'Medir el filtro',
        completed: false,
        position: 0,
        createdAt: OLD,
        updatedAt: NEW,
      },
    ] as any);

    const result = (await replicationService.pull(USER_ID, 0)) as PullResult;

    const task = result.changes.tasks.created![0] as Record<string, unknown>;
    expect(task.order_position).toBe(2);
    expect(task.reschedule_count).toBe(1);
    expect(task.due_date).toBe(NEW.getTime());

    const item = result.changes.task_checklist_items.created![0] as Record<string, unknown>;
    expect(item.task_id).toBe('task-1');
    // Los items no tienen userId: el filtro va por la relación task
    const itemWhere = p.taskChecklistItem.findMany.mock.calls[0][0]?.where as Record<
      string,
      unknown
    >;
    expect(itemWhere.task).toEqual({ userId: USER_ID });
  });

  it('mapea tombstones a deleted[] de su tabla', async () => {
    p.replicationTombstone.findMany.mockResolvedValue([
      { id: 't1', userId: USER_ID, tableName: 'transactions', rowId: 'tx-1', deletedAt: NEW },
      { id: 't2', userId: USER_ID, tableName: 'transactions', rowId: 'tx-2', deletedAt: NEW },
    ] as any);

    const result = (await replicationService.pull(USER_ID, 0)) as PullResult;

    expect(result.changes.transactions.deleted).toEqual(['tx-1', 'tx-2']);
    expect(result.changes.accounts.deleted).toEqual([]);
  });

  it('devuelve fullResyncRequired si lastPulledAt es anterior a la retención de tombstones', async () => {
    const ancient = Date.now() - 200 * 24 * 60 * 60 * 1000; // 200 días

    const result = await replicationService.pull(USER_ID, ancient);

    expect(result).toHaveProperty('fullResyncRequired', true);
    expect(p.account.findMany).not.toHaveBeenCalled();
  });

  it('incluye habits y habit_records en el pull (snake_case, week_days JSON)', async () => {
    p.habit.findMany.mockResolvedValue([
      {
        id: 'hab-1',
        userId: USER_ID,
        categoryId: 'cat-1',
        name: 'Meditar',
        description: null,
        type: 'CHECK',
        targetValue: null,
        unit: null,
        periodicity: 'WEEKLY',
        weekDays: [1, 3, 5],
        timeOfDay: 'MANANA',
        reminderTime: null,
        color: null,
        order: 0,
        isActive: true,
        currentStreak: 4,
        longestStreak: 9,
        lastCompletedDate: OLD,
        createdAt: OLD,
        updatedAt: NEW,
      },
    ] as any);
    p.habitRecord.findMany.mockResolvedValue([
      {
        id: 'rec-1',
        habitId: 'hab-1',
        userId: USER_ID,
        date: NEW,
        completed: true,
        value: null,
        notes: null,
        createdAt: NEW,
        updatedAt: NEW,
      },
    ] as any);

    const result = (await replicationService.pull(USER_ID, 0)) as PullResult;

    const habit = result.changes.habits.created![0] as Record<string, unknown>;
    expect(habit.week_days).toBe('[1,3,5]');
    expect(habit.time_of_day).toBe('MANANA');
    expect(habit.current_streak).toBe(4);
    expect(habit.last_completed_date).toBe(OLD.getTime());

    const record = result.changes.habit_records.created![0] as Record<string, unknown>;
    expect(record.habit_id).toBe('hab-1');
    expect(record.completed).toBe(true);
    expect(record.date).toBe(NEW.getTime());
  });

  it('fullTables pide la tabla completa (sin filtro updatedAt) y todo va como created', async () => {
    const lastPulledAt = new Date('2026-06-15T00:00:00.000Z').getTime();
    p.habit.findMany.mockResolvedValue([
      {
        id: 'hab-viejo',
        userId: USER_ID,
        categoryId: 'cat-1',
        name: 'Leer',
        description: null,
        type: 'CHECK',
        targetValue: null,
        unit: null,
        periodicity: 'DAILY',
        weekDays: [],
        timeOfDay: 'ANYTIME',
        reminderTime: null,
        color: null,
        order: 0,
        isActive: true,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        createdAt: OLD, // anterior al lastPulledAt: igual debe venir como created
        updatedAt: OLD,
      },
    ] as any);

    const result = (await replicationService.pull(USER_ID, lastPulledAt, [
      'habits',
      'habit_records',
    ])) as PullResult;

    // Sin filtro por updatedAt para las tablas migradas
    const habitWhere = p.habit.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
    expect(habitWhere).toEqual({ userId: USER_ID });
    // Las cuentas siguen siendo incrementales
    const accountWhere = p.account.findMany.mock.calls[0][0]?.where as Record<string, unknown>;
    expect(accountWhere).toHaveProperty('updatedAt');

    expect(result.changes.habits.created).toHaveLength(1);
    expect(result.changes.habits.updated).toHaveLength(0);
  });

  it('lastPulledAt=0 (primer pull) NO dispara full-resync y trae todo', async () => {
    p.account.findMany.mockResolvedValue([makeAccount() as any]);

    const result = (await replicationService.pull(USER_ID, 0)) as PullResult;

    expect(result).not.toHaveProperty('fullResyncRequired');
    expect(result.changes.accounts.created).toHaveLength(1);
    expect(result.timestamp).toBeGreaterThan(0);
  });
});
