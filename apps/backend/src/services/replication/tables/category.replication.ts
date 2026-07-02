import { Category, Prisma, Scope } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { CategoryRaw } from '../types.js';

/** Scopes de dinero que replica Fase 1 (incluye `gastos` legacy: hay
 * transactions históricas que lo referencian con onDelete: Restrict). */
export const MONEY_SCOPES: Scope[] = [Scope.ingresos, Scope.egresos, Scope.gastos];

export function toRaw(c: Category): CategoryRaw {
  return {
    id: c.id,
    name: c.name,
    scope: c.scope,
    icon: c.icon,
    color: c.color,
    is_default: c.isDefault,
    is_active: c.isActive,
    created_at: c.createdAt.getTime(),
    updated_at: c.updatedAt.getTime(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function applyCreated(ctx: PushContext, raws: CategoryRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.category.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    if (!MONEY_SCOPES.includes(raw.scope as Scope)) {
      logger.warn(`[replication] category ${raw.id} con scope no-dinero '${raw.scope}': ignorada`);
      continue;
    }

    try {
      await ctx.tx.category.create({
        data: {
          id: raw.id,
          userId: ctx.userId,
          name: raw.name,
          scope: raw.scope as Scope,
          icon: raw.icon,
          color: raw.color,
          isDefault: raw.is_default ?? false,
          isActive: raw.is_active ?? true,
        },
      });
    } catch (error) {
      // (userId, name, scope) único: ya existe una categoría igual creada por
      // otra vía (web) con otro id → el pull le baja la del server al cliente.
      if (isUniqueViolation(error)) {
        logger.warn(
          `[replication] category duplicada '${raw.name}' (${raw.scope}) para user ${ctx.userId}: ignorada`
        );
        continue;
      }
      throw error;
    }
  }
}

export async function applyUpdated(ctx: PushContext, raws: CategoryRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.category.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'categories', raw.id, existing.updatedAt);

    if (raw.scope !== existing.scope) {
      logger.warn(`[replication] cambio de scope ignorado en category ${raw.id} (inmutable)`);
    }

    try {
      await ctx.tx.category.update({
        where: { id: raw.id },
        data: {
          name: raw.name,
          icon: raw.icon,
          color: raw.color,
          isDefault: raw.is_default,
          isActive: raw.is_active,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        logger.warn(
          `[replication] rename de category ${raw.id} choca con nombre existente: ignorado`
        );
        continue;
      }
      throw error;
    }
  }
}
