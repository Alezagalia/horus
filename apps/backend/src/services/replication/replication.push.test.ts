import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/prisma.js', () => {
  const prisma = {
    account: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    category: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    transaction: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    recurringExpense: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    monthlyExpenseInstance: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    budget: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    savingsGoal: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    resource: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    replicationTombstone: { findUnique: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  };
  // El push corre todo en un $transaction(fn): el tx ES el mismo mock.
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma)
  );
  return { prisma };
});

import { prisma } from '../../lib/prisma.js';
import { replicationService } from './index.js';
import { BadRequestError } from '../../middlewares/error.middleware.js';

const p = vi.mocked(prisma, true);

const USER_ID = 'b7e8a4f0-0000-4000-8000-000000000001';
const NOW = new Date('2026-07-01T12:00:00.000Z');

const myAccount = (id: string, currency = 'ARS') => ({
  id,
  userId: USER_ID,
  name: 'Cuenta',
  type: 'banco',
  currency,
  currentBalance: '1000',
  initialBalance: '1000',
  isActive: true,
  color: '#000',
  icon: '🏦',
  createdAt: NOW,
  updatedAt: NOW,
});

const myCategory = (id: string, scope = 'egresos') => ({
  id,
  userId: USER_ID,
  name: 'Cat',
  scope,
  isActive: true,
  isDefault: false,
  icon: null,
  color: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const txRaw = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-1',
  account_id: 'acc-1',
  category_id: 'cat-1',
  type: 'egreso',
  amount: 100,
  concept: 'Compra',
  date: NOW.getTime(),
  notes: null,
  is_transfer: false,
  target_account_id: null,
  transfer_pair_id: null,
  monthly_expense_instance_id: null,
  created_at: NOW.getTime(),
  updated_at: NOW.getTime(),
  ...overrides,
});

const existingTx = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-1',
  userId: USER_ID,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  type: 'egreso',
  amount: '100',
  concept: 'Compra',
  date: NOW,
  notes: null,
  isTransfer: false,
  targetAccountId: null,
  transferPairId: null,
  monthlyExpenseInstanceId: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  (p.$transaction as any).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma)
  );
  p.account.findUnique.mockResolvedValue(myAccount('acc-1') as any);
  p.category.findUnique.mockResolvedValue(myCategory('cat-1') as any);
  p.transaction.findUnique.mockResolvedValue(null);
  p.transaction.findFirst.mockResolvedValue(null);
  p.replicationTombstone.findUnique.mockResolvedValue(null);
  p.replicationTombstone.upsert.mockResolvedValue({} as any);
  p.transaction.create.mockResolvedValue({} as any);
  p.transaction.update.mockResolvedValue({} as any);
  p.transaction.delete.mockResolvedValue({} as any);
  p.account.update.mockResolvedValue({} as any);
  p.resource.findUnique.mockResolvedValue(null);
  p.resource.create.mockResolvedValue({} as any);
  p.resource.update.mockResolvedValue({} as any);
  p.resource.delete.mockResolvedValue({} as any);
});

/** Suma de todos los increments aplicados a currentBalance de una cuenta. */
function balanceIncrements(accountId: string): number[] {
  return p.account.update.mock.calls
    .filter((call) => (call[0] as any).where.id === accountId)
    .map((call) => (call[0] as any).data.currentBalance.increment)
    .filter((inc) => inc !== undefined);
}

describe('push: transactions.created', () => {
  it('crea la tx y aplica el delta (-egreso)', async () => {
    await replicationService.push(USER_ID, {
      transactions: { created: [txRaw()] },
    });

    expect(p.transaction.create).toHaveBeenCalledOnce();
    const data = (p.transaction.create.mock.calls[0][0] as any).data;
    expect(data.id).toBe('tx-1');
    expect(data.userId).toBe(USER_ID);
    expect(balanceIncrements('acc-1')).toEqual([-100]);
  });

  it('retry del mismo push: id existente → no re-crea ni re-aplica delta', async () => {
    p.transaction.findUnique.mockResolvedValue(existingTx() as any);

    await replicationService.push(USER_ID, {
      transactions: { created: [txRaw()] },
    });

    expect(p.transaction.create).not.toHaveBeenCalled();
    expect(p.account.update).not.toHaveBeenCalled();
  });

  it('cuenta ajena → tx ignorada', async () => {
    p.account.findUnique.mockResolvedValue({ ...myAccount('acc-1'), userId: 'otro-user' } as any);

    await replicationService.push(USER_ID, {
      transactions: { created: [txRaw()] },
    });

    expect(p.transaction.create).not.toHaveBeenCalled();
  });

  it('instancia ya imputada por otra tx → descarta la tx entrante (sin delta)', async () => {
    p.transaction.findFirst.mockResolvedValue(existingTx({ id: 'tx-web' }) as any);

    await replicationService.push(USER_ID, {
      transactions: { created: [txRaw({ monthly_expense_instance_id: 'mei-1' })] },
    });

    expect(p.transaction.create).not.toHaveBeenCalled();
    expect(p.account.update).not.toHaveBeenCalled();
  });
});

describe('push: transactions.updated', () => {
  it('cambio de monto → un solo increment con oldDelta+newDelta', async () => {
    p.transaction.findUnique.mockResolvedValue(
      existingTx({ amount: '100', type: 'egreso' }) as any
    );

    await replicationService.push(USER_ID, {
      transactions: { updated: [txRaw({ amount: 150 })] },
    });

    // revert(+100) + apply(-150) = -50
    expect(balanceIncrements('acc-1')).toEqual([-50]);
    expect(p.transaction.update).toHaveBeenCalledOnce();
  });

  it('cambio de cuenta → revert en la vieja, apply en la nueva', async () => {
    p.transaction.findUnique.mockResolvedValue(existingTx({ accountId: 'acc-1' }) as any);
    (p.account.findUnique as any).mockImplementation(
      async (args: any) => ({ ...myAccount(args.where.id) }) as any
    );

    await replicationService.push(USER_ID, {
      transactions: { updated: [txRaw({ account_id: 'acc-2', amount: 100 })] },
    });

    expect(balanceIncrements('acc-1')).toEqual([100]); // revert del egreso
    expect(balanceIncrements('acc-2')).toEqual([-100]); // apply en la nueva
  });

  it('fila con tombstone → no resucita (deleted gana)', async () => {
    p.transaction.findUnique.mockResolvedValue(null);
    p.replicationTombstone.findUnique.mockResolvedValue({ rowId: 'tx-1' } as any);

    await replicationService.push(USER_ID, {
      transactions: { updated: [txRaw()] },
    });

    expect(p.transaction.create).not.toHaveBeenCalled();
    expect(p.transaction.update).not.toHaveBeenCalled();
  });

  it('fila inexistente sin tombstone → degrada a created', async () => {
    await replicationService.push(USER_ID, {
      transactions: { updated: [txRaw()] },
    });

    expect(p.transaction.create).toHaveBeenCalledOnce();
    expect(balanceIncrements('acc-1')).toEqual([-100]);
  });
});

describe('push: transactions.deleted', () => {
  it('revierte el delta, borra y escribe tombstone', async () => {
    p.transaction.findUnique.mockResolvedValue(
      existingTx({ type: 'egreso', amount: '100' }) as any
    );

    await replicationService.push(USER_ID, {
      transactions: { deleted: ['tx-1'] },
    });

    expect(balanceIncrements('acc-1')).toEqual([100]);
    expect(p.transaction.delete).toHaveBeenCalledWith({ where: { id: 'tx-1' } });
    expect(p.replicationTombstone.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tableName_rowId: { tableName: 'transactions', rowId: 'tx-1' } },
      })
    );
  });

  it('transferencia: borra ambas patas, revierte 2 saldos y escribe 2 tombstones', async () => {
    const egreso = existingTx({
      id: 'tx-e',
      type: 'egreso',
      accountId: 'acc-1',
      isTransfer: true,
      transferPairId: 'tx-i',
    });
    const ingreso = existingTx({
      id: 'tx-i',
      type: 'ingreso',
      accountId: 'acc-2',
      isTransfer: true,
      transferPairId: 'tx-e',
    });
    (p.transaction.findUnique as any).mockImplementation(async (args: any) => {
      if (args.where.id === 'tx-e') return egreso as any;
      if (args.where.id === 'tx-i') return ingreso as any;
      return null;
    });

    await replicationService.push(USER_ID, {
      transactions: { deleted: ['tx-e'] },
    });

    expect(balanceIncrements('acc-1')).toEqual([100]); // revert egreso
    expect(balanceIncrements('acc-2')).toEqual([-100]); // revert ingreso
    expect(p.transaction.delete).toHaveBeenCalledTimes(2);
    expect(p.replicationTombstone.upsert).toHaveBeenCalledTimes(2);
  });

  it('id inexistente → solo tombstone (idempotente)', async () => {
    await replicationService.push(USER_ID, {
      transactions: { deleted: ['tx-fantasma'] },
    });

    expect(p.transaction.delete).not.toHaveBeenCalled();
    expect(p.replicationTombstone.upsert).toHaveBeenCalledOnce();
  });
});

describe('push: transferencias created', () => {
  const legE = txRaw({
    id: 'tx-e',
    type: 'egreso',
    account_id: 'acc-1',
    is_transfer: true,
    target_account_id: 'acc-2',
    transfer_pair_id: 'tx-i',
  });
  const legI = txRaw({
    id: 'tx-i',
    type: 'ingreso',
    account_id: 'acc-2',
    is_transfer: true,
    target_account_id: 'acc-1',
    transfer_pair_id: 'tx-e',
  });

  beforeEach(() => {
    (p.account.findUnique as any).mockImplementation(
      async (args: any) => ({ ...myAccount(args.where.id) }) as any
    );
    p.category.findFirst.mockResolvedValue(myCategory('cat-transfer') as any);
  });

  it('par válido: crea 2 txs con ids del cliente y ajusta 2 saldos', async () => {
    await replicationService.push(USER_ID, {
      transactions: { created: [legE, legI] },
    });

    expect(p.transaction.create).toHaveBeenCalledTimes(2);
    const ids = p.transaction.create.mock.calls.map((c) => (c[0] as any).data.id);
    expect(ids).toEqual(expect.arrayContaining(['tx-e', 'tx-i']));
    expect(balanceIncrements('acc-1')).toEqual([-100]);
    expect(balanceIncrements('acc-2')).toEqual([100]);
  });

  it('pata huérfana (pair ni en batch ni en DB) → 400', async () => {
    await expect(
      replicationService.push(USER_ID, { transactions: { created: [legE] } })
    ).rejects.toThrow(BadRequestError);
  });

  it('monedas distintas → 400', async () => {
    (p.account.findUnique as any).mockImplementation(
      async (args: any) =>
        ({ ...myAccount(args.where.id, args.where.id === 'acc-2' ? 'USD' : 'ARS') }) as any
    );

    await expect(
      replicationService.push(USER_ID, { transactions: { created: [legE, legI] } })
    ).rejects.toThrow(BadRequestError);
  });

  it('retry: si una pata ya existe, no se re-aplica nada', async () => {
    (p.transaction.findUnique as any).mockImplementation(async (args: any) =>
      args.where.id === 'tx-e' || args.where.id === 'tx-i'
        ? (existingTx({ id: args.where.id }) as any)
        : null
    );

    await replicationService.push(USER_ID, {
      transactions: { created: [legE, legI] },
    });

    expect(p.transaction.create).not.toHaveBeenCalled();
    expect(p.account.update).not.toHaveBeenCalled();
  });
});

describe('push: pago de gasto mensual offline', () => {
  const instance = {
    id: 'mei-1',
    userId: USER_ID,
    recurringExpenseId: 're-1',
    month: 7,
    year: 2026,
    concept: 'Alquiler',
    categoryId: 'cat-1',
    amount: '500',
    previousAmount: null,
    accountId: null,
    paidDate: null,
    status: 'pendiente',
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
  const meiRaw = {
    id: 'mei-1',
    recurring_expense_id: 're-1',
    month: 7,
    year: 2026,
    concept: 'Alquiler',
    category_id: 'cat-1',
    amount: 550,
    previous_amount: 500,
    account_id: 'acc-1',
    paid_date: NOW.getTime(),
    status: 'pagado',
    notes: null,
    created_at: NOW.getTime(),
    updated_at: NOW.getTime(),
  };
  const payTx = txRaw({ id: 'tx-pago', amount: 550, monthly_expense_instance_id: 'mei-1' });

  it('claim gana: instancia pagada + tx creada + saldo decrementado', async () => {
    p.monthlyExpenseInstance.findUnique.mockResolvedValue(instance as any);
    p.monthlyExpenseInstance.updateMany.mockResolvedValue({ count: 1 } as any);

    await replicationService.push(USER_ID, {
      monthly_expense_instances: { updated: [meiRaw] },
      transactions: { created: [payTx] },
    });

    const claim = p.monthlyExpenseInstance.updateMany.mock.calls[0][0] as any;
    expect(claim.where).toEqual({ id: 'mei-1', userId: USER_ID, status: 'pendiente' });
    expect(claim.data.status).toBe('pagado');
    expect(p.transaction.create).toHaveBeenCalledOnce();
    expect(balanceIncrements('acc-1')).toEqual([-550]);
  });

  it('claim pierde (ya pagado por web): tx entrante descartada, saldo intacto', async () => {
    p.monthlyExpenseInstance.findUnique.mockResolvedValue(instance as any);
    p.monthlyExpenseInstance.updateMany.mockResolvedValue({ count: 0 } as any);

    await replicationService.push(USER_ID, {
      monthly_expense_instances: { updated: [meiRaw] },
      transactions: { created: [payTx] },
    });

    expect(p.transaction.create).not.toHaveBeenCalled();
    expect(p.account.update).not.toHaveBeenCalled();
  });

  it('created de instancias desde el cliente se ignora (las genera el server)', async () => {
    await replicationService.push(USER_ID, {
      monthly_expense_instances: { created: [meiRaw] },
    });

    expect(p.monthlyExpenseInstance.update).not.toHaveBeenCalled();
    expect(p.monthlyExpenseInstance.updateMany).not.toHaveBeenCalled();
  });
});

describe('push: resources', () => {
  const resourceRaw = (overrides: Record<string, unknown> = {}) => ({
    id: 'res-1',
    category_id: null,
    type: 'NOTE',
    title: 'Nota offline',
    description: null,
    content: 'contenido',
    url: null,
    language: null,
    metadata: null,
    tags: '["dev","ideas"]',
    is_pinned: false,
    color: null,
    created_at: NOW.getTime(),
    updated_at: NOW.getTime(),
    ...overrides,
  });

  const existingResource = (overrides: Record<string, unknown> = {}) => ({
    id: 'res-1',
    userId: USER_ID,
    categoryId: null,
    type: 'NOTE',
    title: 'Nota offline',
    description: null,
    content: 'contenido',
    url: null,
    language: null,
    metadata: null,
    tags: ['dev', 'ideas'],
    isPinned: false,
    color: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

  describe('created', () => {
    it('crea el recurso con userId y tags/metadata parseados', async () => {
      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw({ metadata: '{"source":"web"}' })] },
      });

      expect(p.resource.create).toHaveBeenCalledOnce();
      const data = (p.resource.create.mock.calls[0][0] as any).data;
      expect(data.id).toBe('res-1');
      expect(data.userId).toBe(USER_ID);
      expect(data.tags).toEqual(['dev', 'ideas']);
      expect(data.metadata).toEqual({ source: 'web' });
    });

    it('retry del mismo push: id existente → no re-crea', async () => {
      p.resource.findUnique.mockResolvedValue(existingResource() as any);

      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw()] },
      });

      expect(p.resource.create).not.toHaveBeenCalled();
    });

    it('type inválido → ignorado', async () => {
      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw({ type: 'INVALIDO' })] },
      });

      expect(p.resource.create).not.toHaveBeenCalled();
    });

    it('fila con tombstone → no se crea (deleted gana)', async () => {
      p.replicationTombstone.findUnique.mockResolvedValue({ rowId: 'res-1' } as any);

      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw()] },
      });

      expect(p.resource.create).not.toHaveBeenCalled();
    });

    it('categoría de scope knowledge → se conserva', async () => {
      p.category.findUnique.mockResolvedValue(myCategory('cat-know', 'knowledge') as any);

      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw({ category_id: 'cat-know' })] },
      });

      const data = (p.resource.create.mock.calls[0][0] as any).data;
      expect(data.categoryId).toBe('cat-know');
    });

    it('categoría ajena o de otro scope → se anula a null sin descartar el recurso', async () => {
      p.category.findUnique.mockResolvedValue(myCategory('cat-1', 'tareas') as any);

      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw({ category_id: 'cat-1' })] },
      });

      expect(p.resource.create).toHaveBeenCalledOnce();
      const data = (p.resource.create.mock.calls[0][0] as any).data;
      expect(data.categoryId).toBeNull();
    });

    it('tags corrupto → se degrada a []', async () => {
      await replicationService.push(USER_ID, {
        resources: { created: [resourceRaw({ tags: 'no-es-json' })] },
      });

      const data = (p.resource.create.mock.calls[0][0] as any).data;
      expect(data.tags).toEqual([]);
    });
  });

  describe('updated', () => {
    it('actualiza campos y preserva metadata passthrough', async () => {
      p.resource.findUnique.mockResolvedValue(existingResource() as any);

      await replicationService.push(USER_ID, {
        resources: {
          updated: [resourceRaw({ title: 'Renombrada', is_pinned: true, metadata: '{"a":1}' })],
        },
      });

      expect(p.resource.update).toHaveBeenCalledOnce();
      const call = p.resource.update.mock.calls[0][0] as any;
      expect(call.where).toEqual({ id: 'res-1' });
      expect(call.data.title).toBe('Renombrada');
      expect(call.data.isPinned).toBe(true);
      expect(call.data.metadata).toEqual({ a: 1 });
    });

    it('recurso ajeno → ignorado', async () => {
      p.resource.findUnique.mockResolvedValue(existingResource({ userId: 'otro-user' }) as any);

      await replicationService.push(USER_ID, {
        resources: { updated: [resourceRaw()] },
      });

      expect(p.resource.update).not.toHaveBeenCalled();
      expect(p.resource.create).not.toHaveBeenCalled();
    });

    it('fila inexistente sin tombstone → degrada a created', async () => {
      await replicationService.push(USER_ID, {
        resources: { updated: [resourceRaw()] },
      });

      expect(p.resource.update).not.toHaveBeenCalled();
      expect(p.resource.create).toHaveBeenCalledOnce();
    });

    it('fila inexistente con tombstone → no resucita', async () => {
      p.replicationTombstone.findUnique.mockResolvedValue({ rowId: 'res-1' } as any);

      await replicationService.push(USER_ID, {
        resources: { updated: [resourceRaw()] },
      });

      expect(p.resource.update).not.toHaveBeenCalled();
      expect(p.resource.create).not.toHaveBeenCalled();
    });
  });

  describe('deleted', () => {
    it('borra y escribe tombstone', async () => {
      p.resource.findUnique.mockResolvedValue(existingResource() as any);

      await replicationService.push(USER_ID, {
        resources: { deleted: ['res-1'] },
      });

      expect(p.resource.delete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
      expect(p.replicationTombstone.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tableName_rowId: { tableName: 'resources', rowId: 'res-1' } },
        })
      );
    });

    it('id inexistente → solo tombstone (idempotente)', async () => {
      await replicationService.push(USER_ID, {
        resources: { deleted: ['res-fantasma'] },
      });

      expect(p.resource.delete).not.toHaveBeenCalled();
      expect(p.replicationTombstone.upsert).toHaveBeenCalledOnce();
    });

    it('recurso ajeno → ni borra ni escribe tombstone', async () => {
      p.resource.findUnique.mockResolvedValue(existingResource({ userId: 'otro-user' }) as any);

      await replicationService.push(USER_ID, {
        resources: { deleted: ['res-1'] },
      });

      expect(p.resource.delete).not.toHaveBeenCalled();
      expect(p.replicationTombstone.upsert).not.toHaveBeenCalled();
    });
  });
});

describe('push: accounts', () => {
  it('updated ignora el balance del cliente (read-only derivado)', async () => {
    p.account.findUnique.mockResolvedValue(myAccount('acc-1') as any);

    await replicationService.push(USER_ID, {
      accounts: {
        updated: [
          {
            id: 'acc-1',
            name: 'Renombrada',
            type: 'banco',
            currency: 'ARS',
            balance: 999999,
            initial_balance: 1000,
            color: '#000',
            icon: '🏦',
            is_active: true,
            created_at: NOW.getTime(),
            updated_at: NOW.getTime(),
          },
        ],
      },
    });

    expect(p.account.update).toHaveBeenCalledOnce();
    const data = (p.account.update.mock.calls[0][0] as any).data;
    expect(data.name).toBe('Renombrada');
    expect(data.currentBalance).toBeUndefined();
    expect(data.initialBalance).toBeUndefined();
  });

  it('created acepta el balance como balance inicial', async () => {
    p.account.findUnique.mockResolvedValue(null);
    p.account.create.mockResolvedValue({} as any);

    await replicationService.push(USER_ID, {
      accounts: {
        created: [
          {
            id: 'acc-off',
            name: 'Nueva offline',
            type: 'efectivo',
            currency: 'ARS',
            balance: 250,
            initial_balance: 250,
            color: null,
            icon: null,
            is_active: true,
            created_at: NOW.getTime(),
            updated_at: NOW.getTime(),
          },
        ],
      },
    });

    const data = (p.account.create.mock.calls[0][0] as any).data;
    expect(data.initialBalance).toBe(250);
    expect(data.currentBalance).toBe(250);
    expect(data.userId).toBe(USER_ID);
  });
});
