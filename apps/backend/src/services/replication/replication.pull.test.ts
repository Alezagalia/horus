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

  it('filtra categories a los scopes de dinero', async () => {
    await replicationService.pull(USER_ID, 0);

    const where = p.category.findMany.mock.calls[0][0]?.where as {
      scope: { in: string[] };
    };
    expect(where.scope.in).toEqual(expect.arrayContaining(['ingresos', 'egresos', 'gastos']));
    expect(where.scope.in).toHaveLength(3);
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

  it('lastPulledAt=0 (primer pull) NO dispara full-resync y trae todo', async () => {
    p.account.findMany.mockResolvedValue([makeAccount() as any]);

    const result = (await replicationService.pull(USER_ID, 0)) as PullResult;

    expect(result).not.toHaveProperty('fullResyncRequired');
    expect(result.changes.accounts.created).toHaveLength(1);
    expect(result.timestamp).toBeGreaterThan(0);
  });
});
