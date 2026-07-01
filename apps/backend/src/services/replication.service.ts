import { prisma } from '../lib/prisma.js';
import { AccountType } from '../generated/prisma/client.js';

/**
 * Replicación offline-first (Fase 0 / spike) — sólo `accounts`.
 * Contrato compatible con `synchronize()` de WatermelonDB:
 *  - pull: { changes: { accounts: { created, updated, deleted } }, timestamp }
 *  - push: aplica created/updated (upsert por id, idempotente) + deleted.
 * Timestamps en milisegundos. Columnas en snake_case (convención Watermelon).
 * (Distinto de `/api/sync`, que es el sync de Google Calendar.)
 */

type AccountRaw = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  color: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
};

function toRaw(a: {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: unknown;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AccountRaw {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: Number(a.currentBalance),
    color: a.color,
    is_active: a.isActive,
    created_at: a.createdAt.getTime(),
    updated_at: a.updatedAt.getTime(),
  };
}

export const replicationService = {
  async pull(userId: string, lastPulledAt: number) {
    const since = new Date(lastPulledAt || 0);
    const accounts = await prisma.account.findMany({
      where: { userId, updatedAt: { gt: since } },
    });

    const created: AccountRaw[] = [];
    const updated: AccountRaw[] = [];
    for (const a of accounts) {
      const raw = toRaw(a);
      if (a.createdAt.getTime() > (lastPulledAt || 0)) created.push(raw);
      else updated.push(raw);
    }

    return {
      changes: { accounts: { created, updated, deleted: [] as string[] } },
      timestamp: Date.now(),
    };
  },

  async push(
    userId: string,
    changes: { accounts?: { created?: AccountRaw[]; updated?: AccountRaw[] } }
  ) {
    const acc = changes?.accounts ?? {};
    const rows = [...(acc.created ?? []), ...(acc.updated ?? [])];
    if (rows.length === 0) return;

    await prisma.$transaction(async (tx) => {
      for (const raw of rows) {
        const existing = await tx.account.findUnique({ where: { id: raw.id } });
        if (existing) {
          if (existing.userId !== userId) continue; // no tocar cuentas de otro usuario
          await tx.account.update({
            where: { id: raw.id },
            data: {
              name: raw.name,
              type: raw.type as AccountType,
              currency: raw.currency,
              color: raw.color ?? existing.color,
              isActive: raw.is_active,
            },
          });
        } else {
          // Create con el id del cliente => idempotente: reenviar el mismo id no duplica.
          await tx.account.create({
            data: {
              id: raw.id,
              userId,
              name: raw.name,
              type: raw.type as AccountType,
              currency: raw.currency,
              initialBalance: raw.balance ?? 0,
              currentBalance: raw.balance ?? 0,
              color: raw.color ?? '#3B82F6',
              icon: '🏦',
              isActive: raw.is_active ?? true,
            },
          });
        }
      }
    });
  },
};
