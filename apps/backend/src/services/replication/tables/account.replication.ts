import { Account, AccountType } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { round2 } from '../balance.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { AccountRaw } from '../types.js';

export function toRaw(a: Account): AccountRaw {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: Number(a.currentBalance),
    color: a.color,
    icon: a.icon,
    is_active: a.isActive,
    created_at: a.createdAt.getTime(),
    updated_at: a.updatedAt.getTime(),
  };
}

export async function applyCreated(ctx: PushContext, raws: AccountRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.account.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    // Cuenta creada offline: el balance del cliente es el balance inicial.
    // Las transactions del mismo push aplican sus deltas encima.
    const balance = round2(raw.balance ?? 0);
    await ctx.tx.account.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        name: raw.name,
        type: raw.type as AccountType,
        currency: raw.currency,
        initialBalance: balance,
        currentBalance: balance,
        color: raw.color ?? '#3B82F6',
        icon: raw.icon ?? '🏦',
        isActive: raw.is_active ?? true,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: AccountRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.account.findUnique({ where: { id: raw.id } });
    if (!existing) {
      // Watermelon puede degradar created→updated si el pull intermedio falló
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'accounts', raw.id, existing.updatedAt);

    // currency es inmutable si la cuenta tiene transacciones (rompería transferencias)
    let currency = raw.currency;
    if (currency !== existing.currency) {
      const txCount = await ctx.tx.transaction.count({ where: { accountId: raw.id } });
      if (txCount > 0) {
        logger.warn(
          `[replication] cambio de currency ignorado en account ${raw.id} (tiene ${txCount} transacciones)`
        );
        currency = existing.currency;
      }
    }

    // balance NUNCA se acepta en updated: es derivado y read-only desde el server
    await ctx.tx.account.update({
      where: { id: raw.id },
      data: {
        name: raw.name,
        type: raw.type as AccountType,
        currency,
        color: raw.color ?? existing.color,
        icon: raw.icon ?? existing.icon,
        isActive: raw.is_active,
      },
    });
  }
}
