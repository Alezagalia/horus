import { SavingsGoal, SavingsGoalStatus } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { round2 } from '../balance.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { SavingsGoalRaw } from '../types.js';

export function toRaw(g: SavingsGoal): SavingsGoalRaw {
  return {
    id: g.id,
    account_id: g.accountId,
    name: g.name,
    target_amount: Number(g.targetAmount),
    target_date: g.targetDate ? g.targetDate.getTime() : null,
    notes: g.notes,
    status: g.status,
    is_active: g.isActive,
    created_at: g.createdAt.getTime(),
    updated_at: g.updatedAt.getTime(),
  };
}

async function accountBelongsToUser(ctx: PushContext, accountId: string): Promise<boolean> {
  const account = await ctx.tx.account.findUnique({ where: { id: accountId } });
  return account !== null && account.userId === ctx.userId;
}

export async function applyCreated(ctx: PushContext, raws: SavingsGoalRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.savingsGoal.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    if (!(await accountBelongsToUser(ctx, raw.account_id))) {
      logger.warn(`[replication] savings_goal ${raw.id} con cuenta ajena/inexistente: ignorada`);
      continue;
    }

    await ctx.tx.savingsGoal.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        accountId: raw.account_id,
        name: raw.name,
        targetAmount: round2(raw.target_amount),
        targetDate: raw.target_date ? new Date(raw.target_date) : null,
        notes: raw.notes,
        status: raw.status as SavingsGoalStatus,
        isActive: raw.is_active ?? true,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: SavingsGoalRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.savingsGoal.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'savings_goals', raw.id, existing.updatedAt);

    let accountId = raw.account_id;
    if (accountId !== existing.accountId && !(await accountBelongsToUser(ctx, accountId))) {
      accountId = existing.accountId;
    }

    await ctx.tx.savingsGoal.update({
      where: { id: raw.id },
      data: {
        accountId,
        name: raw.name,
        targetAmount: round2(raw.target_amount),
        targetDate: raw.target_date ? new Date(raw.target_date) : null,
        notes: raw.notes,
        status: raw.status as SavingsGoalStatus,
        isActive: raw.is_active,
      },
    });
  }
}
