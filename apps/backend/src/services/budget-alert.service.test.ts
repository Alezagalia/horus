import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    budget: { findFirst: vi.fn() },
    notification: { findFirst: vi.fn(), create: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('./push/push-notification.service.js', () => ({
  sendToUser: vi.fn(),
}));

import { prisma } from '../lib/prisma.js';
import { sendToUser } from './push/push-notification.service.js';
import { checkBudgetThreshold } from './budget-alert.service.js';

const p = vi.mocked(prisma, true);
const mockedSend = vi.mocked(sendToUser);

const USER_ID = 'user-1';
const CATEGORY_ID = 'cat-1';
const CURRENCY = 'ARS';
const DATE = new Date('2026-06-16T12:00:00.000Z'); // mes 6, año 2026

const mockBudget = {
  id: 'budget-1',
  userId: USER_ID,
  categoryId: CATEGORY_ID,
  amount: 10000, // .toString() funciona como un Decimal
  currency: CURRENCY,
  isActive: true,
  category: { name: 'Supermercado' },
};

const input = { userId: USER_ID, categoryId: CATEGORY_ID, currency: CURRENCY, date: DATE };

/** Configura el gasto que devuelve el $queryRaw. */
function mockSpent(spent: number) {
  p.$queryRaw.mockResolvedValue([{ spent: String(spent) }] as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedSend.mockResolvedValue({ success: true, sentCount: 1, failedCount: 0, errors: [] });
  p.notification.findFirst.mockResolvedValue(null); // por defecto: no enviado antes
  p.notification.create.mockResolvedValue({} as any);
});

describe('checkBudgetThreshold', () => {
  it('no hace nada si no hay presupuesto para la categoría+moneda', async () => {
    p.budget.findFirst.mockResolvedValue(null);

    await checkBudgetThreshold(input);

    expect(mockedSend).not.toHaveBeenCalled();
    expect(p.notification.create).not.toHaveBeenCalled();
  });

  it('no envía si el gasto está por debajo del 80%', async () => {
    p.budget.findFirst.mockResolvedValue(mockBudget as any);
    mockSpent(7000); // 70%

    await checkBudgetThreshold(input);

    expect(mockedSend).not.toHaveBeenCalled();
    expect(p.notification.create).not.toHaveBeenCalled();
  });

  it('envía alerta de 80% cuando se cruza ese umbral', async () => {
    p.budget.findFirst.mockResolvedValue(mockBudget as any);
    mockSpent(8500); // 85%

    await checkBudgetThreshold(input);

    expect(mockedSend).toHaveBeenCalledTimes(1);
    const arg = mockedSend.mock.calls[0][0];
    expect(arg.title).toContain('80%');
    expect(arg.data?.threshold).toBe('80');
    expect(arg.data?.percentage).toBe('85');
    expect(p.notification.create).toHaveBeenCalledTimes(1);
  });

  it('envía alerta de presupuesto superado al llegar al 100%', async () => {
    p.budget.findFirst.mockResolvedValue(mockBudget as any);
    mockSpent(10500); // 105%

    await checkBudgetThreshold(input);

    const arg = mockedSend.mock.calls[0][0];
    expect(arg.title).toContain('superado');
    expect(arg.data?.threshold).toBe('100');
  });

  it('al saltar directo por encima del 100% solo notifica el umbral más alto (100, no 80)', async () => {
    p.budget.findFirst.mockResolvedValue(mockBudget as any);
    mockSpent(13000); // 130%

    await checkBudgetThreshold(input);

    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(mockedSend.mock.calls[0][0].data?.threshold).toBe('100');
  });

  it('no reenvía si ese umbral ya fue notificado este mes (anti-spam)', async () => {
    p.budget.findFirst.mockResolvedValue(mockBudget as any);
    mockSpent(8500); // 85%
    p.notification.findFirst.mockResolvedValue({ id: 'existing' } as any);

    await checkBudgetThreshold(input);

    expect(mockedSend).not.toHaveBeenCalled();
    expect(p.notification.create).not.toHaveBeenCalled();
  });

  it('usa una dedupKey por presupuesto/mes/umbral al chequear duplicados', async () => {
    p.budget.findFirst.mockResolvedValue(mockBudget as any);
    mockSpent(8500);

    await checkBudgetThreshold(input);

    expect(p.notification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'budget_alert',
          data: { contains: 'budget:budget-1:2026-6:80' },
        }),
      })
    );
  });

  it('no lanza si el presupuesto tiene monto 0', async () => {
    p.budget.findFirst.mockResolvedValue({ ...mockBudget, amount: 0 } as any);

    await expect(checkBudgetThreshold(input)).resolves.toBeUndefined();
    expect(mockedSend).not.toHaveBeenCalled();
  });
});
