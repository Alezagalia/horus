/**
 * Savings Goal Service
 * Metas de Ahorro vinculadas a Cuentas
 *
 * Business logic for savings goal CRUD and automatic progress calculation.
 * Progress is derived from account.currentBalance vs targetAmount.
 */

import { SavingsGoalStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import {
  CreateSavingsGoalInput,
  UpdateSavingsGoalInput,
} from '../validations/savings-goal.validation.js';

function buildProgress(goal: {
  targetAmount: { toString(): string };
  account: { currentBalance: { toString(): string } };
  status: SavingsGoalStatus;
}) {
  const savedAmount = Number(goal.account.currentBalance);
  const targetAmount = Number(goal.targetAmount);
  const progress = Math.min(Math.round((savedAmount / targetAmount) * 100), 100);
  const remaining = Math.max(targetAmount - savedAmount, 0);
  return { savedAmount, remaining, progress };
}

const accountSelect = {
  id: true,
  name: true,
  icon: true,
  color: true,
  currency: true,
  currentBalance: true,
};

/**
 * List all active savings goals for a user (with progress).
 */
export const listSavingsGoals = async (userId: string) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId, isActive: true },
    include: { account: { select: accountSelect } },
    orderBy: { createdAt: 'desc' },
  });

  return goals.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    account: { ...g.account, currentBalance: Number(g.account.currentBalance) },
    ...buildProgress(g),
  }));
};

/**
 * Get a single savings goal by id (with progress). Validates ownership.
 */
export const getSavingsGoal = async (id: string, userId: string) => {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId, isActive: true },
    include: { account: { select: accountSelect } },
  });

  if (!goal) throw new Error('Meta de ahorro no encontrada');

  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    account: { ...goal.account, currentBalance: Number(goal.account.currentBalance) },
    ...buildProgress(goal),
  };
};

/**
 * Create a new savings goal. Validates account ownership.
 */
export const createSavingsGoal = async (userId: string, data: CreateSavingsGoalInput) => {
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId, isActive: true },
    select: accountSelect,
  });

  if (!account) {
    throw new Error('La cuenta no existe, no está activa o no te pertenece');
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      userId,
      accountId: data.accountId,
      name: data.name,
      targetAmount: data.targetAmount,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      notes: data.notes ?? null,
    },
    include: { account: { select: accountSelect } },
  });

  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    account: { ...goal.account, currentBalance: Number(goal.account.currentBalance) },
    ...buildProgress(goal),
  };
};

/**
 * Update an existing savings goal.
 * Auto-completes when balance >= targetAmount and status is en_progreso.
 */
export const updateSavingsGoal = async (
  id: string,
  userId: string,
  data: UpdateSavingsGoalInput
) => {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id, userId, isActive: true },
    include: { account: { select: accountSelect } },
  });

  if (!existing) throw new Error('Meta de ahorro no encontrada');

  const newTargetAmount = data.targetAmount ?? Number(existing.targetAmount);
  const currentBalance = Number(existing.account.currentBalance);

  // Determine effective status: auto-complete if balance meets target
  let effectiveStatus = data.status ?? existing.status;
  if (effectiveStatus === SavingsGoalStatus.en_progreso && currentBalance >= newTargetAmount) {
    effectiveStatus = SavingsGoalStatus.completada;
  }

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
      ...(data.targetDate !== undefined && {
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes }),
      status: effectiveStatus,
    },
    include: { account: { select: accountSelect } },
  });

  return {
    ...updated,
    targetAmount: Number(updated.targetAmount),
    account: { ...updated.account, currentBalance: Number(updated.account.currentBalance) },
    ...buildProgress({ ...updated, status: effectiveStatus }),
  };
};

/**
 * Soft delete a savings goal (isActive = false).
 */
export const deleteSavingsGoal = async (id: string, userId: string) => {
  const existing = await prisma.savingsGoal.findFirst({
    where: { id, userId, isActive: true },
  });

  if (!existing) throw new Error('Meta de ahorro no encontrada');

  return prisma.savingsGoal.update({
    where: { id },
    data: { isActive: false },
  });
};
