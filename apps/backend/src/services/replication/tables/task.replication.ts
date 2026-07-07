import { Priority, Scope, Task, TaskStatus } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { TaskRaw } from '../types.js';

export function toRaw(t: Task): TaskRaw {
  return {
    id: t.id,
    category_id: t.categoryId,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    due_date: t.dueDate ? t.dueDate.getTime() : null,
    completed_at: t.completedAt ? t.completedAt.getTime() : null,
    canceled_at: t.canceledAt ? t.canceledAt.getTime() : null,
    archived_at: t.archivedAt ? t.archivedAt.getTime() : null,
    cancel_reason: t.cancelReason,
    is_active: t.isActive,
    order_position: t.orderPosition,
    reschedule_count: t.rescheduleCount,
    created_at: t.createdAt.getTime(),
    updated_at: t.updatedAt.getTime(),
  };
}

async function taskCategoryIsValid(ctx: PushContext, categoryId: string): Promise<boolean> {
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  return category !== null && category.userId === ctx.userId && category.scope === Scope.tareas;
}

const msToDate = (ms: number | null | undefined): Date | null => (ms != null ? new Date(ms) : null);

export async function applyCreated(ctx: PushContext, raws: TaskRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.task.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    if (!(await taskCategoryIsValid(ctx, raw.category_id))) {
      logger.warn(`[replication] task ${raw.id} con categoría ajena/inválida: ignorada`);
      continue;
    }

    // Tombstone gana: si la task fue borrada desde otra vía entre pulls, el
    // create degradado del cliente no debe resucitarla.
    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'tasks', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] task ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    await ctx.tx.task.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        categoryId: raw.category_id,
        title: raw.title,
        description: raw.description,
        priority: raw.priority as Priority,
        status: raw.status as TaskStatus,
        dueDate: msToDate(raw.due_date),
        completedAt: msToDate(raw.completed_at),
        canceledAt: msToDate(raw.canceled_at),
        archivedAt: msToDate(raw.archived_at),
        cancelReason: raw.cancel_reason,
        isActive: raw.is_active ?? true,
        orderPosition: raw.order_position ?? 0,
        rescheduleCount: raw.reschedule_count ?? 0,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: TaskRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.task.findUnique({ where: { id: raw.id } });
    if (!existing) {
      // Watermelon puede degradar created→updated si el pull intermedio falló
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    logIfConflict(ctx, 'tasks', raw.id, existing.updatedAt);

    let categoryId = raw.category_id;
    if (categoryId !== existing.categoryId && !(await taskCategoryIsValid(ctx, categoryId))) {
      categoryId = existing.categoryId;
    }

    await ctx.tx.task.update({
      where: { id: raw.id },
      data: {
        categoryId,
        title: raw.title,
        description: raw.description,
        priority: raw.priority as Priority,
        status: raw.status as TaskStatus,
        dueDate: msToDate(raw.due_date),
        completedAt: msToDate(raw.completed_at),
        canceledAt: msToDate(raw.canceled_at),
        archivedAt: msToDate(raw.archived_at),
        cancelReason: raw.cancel_reason,
        isActive: raw.is_active,
        orderPosition: raw.order_position ?? existing.orderPosition,
        rescheduleCount: raw.reschedule_count ?? existing.rescheduleCount,
      },
    });
  }
}

/** Hard delete (como el REST): tombstones del task y sus items, luego delete
 * (el CASCADE de Prisma borra los items). Idempotente en retries. */
export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.task.findUnique({ where: { id } });
    if (!existing) {
      // Ya borrada (retry, o delete concurrente desde web): asegurar tombstone
      await recordTombstones(ctx.tx, ctx.userId, 'tasks', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    const items = await ctx.tx.taskChecklistItem.findMany({
      where: { taskId: id },
      select: { id: true },
    });
    await recordTombstones(ctx.tx, ctx.userId, 'tasks', [id]);
    if (items.length > 0) {
      await recordTombstones(
        ctx.tx,
        ctx.userId,
        'task_checklist_items',
        items.map((i) => i.id)
      );
    }
    await ctx.tx.task.delete({ where: { id } });
  }
}
