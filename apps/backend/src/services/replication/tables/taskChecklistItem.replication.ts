import { TaskChecklistItem } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { TaskChecklistItemRaw } from '../types.js';

export function toRaw(i: TaskChecklistItem): TaskChecklistItemRaw {
  return {
    id: i.id,
    task_id: i.taskId,
    title: i.title,
    completed: i.completed,
    position: i.position,
    created_at: i.createdAt.getTime(),
    updated_at: i.updatedAt.getTime(),
  };
}

/** El item no tiene userId propio: la ownership se valida vía su task. */
async function taskBelongsToUser(ctx: PushContext, taskId: string): Promise<boolean> {
  const task = await ctx.tx.task.findUnique({ where: { id: taskId } });
  return task !== null && task.userId === ctx.userId;
}

export async function applyCreated(ctx: PushContext, raws: TaskChecklistItemRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.taskChecklistItem.findUnique({ where: { id: raw.id } });
    if (existing) continue;

    if (!(await taskBelongsToUser(ctx, raw.task_id))) {
      // El task pudo haber sido borrado (tombstone gana) o ser ajeno
      logger.warn(`[replication] checklist item ${raw.id} de task ajena/inexistente: ignorado`);
      continue;
    }

    await ctx.tx.taskChecklistItem.create({
      data: {
        id: raw.id,
        taskId: raw.task_id,
        title: raw.title,
        completed: raw.completed ?? false,
        position: raw.position ?? 0,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: TaskChecklistItemRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.taskChecklistItem.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (!(await taskBelongsToUser(ctx, existing.taskId))) continue;
    logIfConflict(ctx, 'task_checklist_items', raw.id, existing.updatedAt);

    await ctx.tx.taskChecklistItem.update({
      where: { id: raw.id },
      data: {
        title: raw.title,
        completed: raw.completed,
        position: raw.position ?? existing.position,
        // task_id no se acepta: un item no se mueve de task
      },
    });
  }
}

export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.taskChecklistItem.findUnique({ where: { id } });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'task_checklist_items', [id]);
      continue;
    }
    if (!(await taskBelongsToUser(ctx, existing.taskId))) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'task_checklist_items', [id]);
    await ctx.tx.taskChecklistItem.delete({ where: { id } });
  }
}
