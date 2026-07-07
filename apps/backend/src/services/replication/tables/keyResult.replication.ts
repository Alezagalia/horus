import { KeyResult } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { KeyResultRaw } from '../types.js';

export function toRaw(kr: KeyResult): KeyResultRaw {
  return {
    id: kr.id,
    goal_id: kr.goalId,
    title: kr.title,
    target_value: Number(kr.targetValue),
    current_value: Number(kr.currentValue),
    unit: kr.unit,
    is_active: kr.isActive,
    created_at: kr.createdAt.getTime(),
    updated_at: kr.updatedAt.getTime(),
  };
}

/** El KR no tiene userId propio: la ownership se valida vía su goal. */
async function goalBelongsToUser(ctx: PushContext, goalId: string): Promise<boolean> {
  const goal = await ctx.tx.goal.findUnique({ where: { id: goalId } });
  return goal !== null && goal.userId === ctx.userId;
}

export async function applyCreated(ctx: PushContext, raws: KeyResultRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.keyResult.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    if (!(await goalBelongsToUser(ctx, raw.goal_id))) {
      logger.warn(`[replication] key_result ${raw.id} de meta ajena/inexistente: ignorado`);
      continue;
    }

    await ctx.tx.keyResult.create({
      data: {
        id: raw.id,
        goalId: raw.goal_id,
        title: raw.title,
        targetValue: raw.target_value ?? 0,
        currentValue: raw.current_value ?? 0,
        unit: raw.unit,
        isActive: raw.is_active ?? true,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: KeyResultRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.keyResult.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (!(await goalBelongsToUser(ctx, existing.goalId))) continue;
    logIfConflict(ctx, 'key_results', raw.id, existing.updatedAt);

    // current_value es LWW client-wins: es editable a mano desde la UI, pero
    // también lo incrementan los hábitos vinculados (server-side). Una edición
    // offline concurrente con un incremento puede pisarlo — se acepta y el
    // conflicto queda logueado arriba (caso raro; el pull re-converge).
    await ctx.tx.keyResult.update({
      where: { id: raw.id },
      data: {
        title: raw.title,
        targetValue: raw.target_value ?? Number(existing.targetValue),
        currentValue: raw.current_value ?? Number(existing.currentValue),
        unit: raw.unit,
        isActive: raw.is_active,
        // goal_id no se acepta: un KR no se mueve de meta
      },
    });
  }
}
