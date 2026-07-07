import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { requestSync } from './syncScheduler';
import { Task as TaskModel } from './models/Task';
import { TaskChecklistItem as TaskChecklistItemModel } from './models/TaskChecklistItem';
import { Category as CategoryModel } from './models/Category';
import type { CreateTaskDTO, UpdateTaskDTO } from '@/services/api/taskApi';

/**
 * Escrituras locales del dominio Tareas (offline-first Fase 2b). Mismas
 * transiciones de estado que task.service del backend (completedAt/canceledAt/
 * archivedAt, rescheduleCount). El delete es HARD (como el REST): viaja como
 * `deleted` en el push y el server registra tombstones.
 */

const tasks = () => database.get<TaskModel>('tasks');
const checklistItems = () => database.get<TaskChecklistItemModel>('task_checklist_items');
const categories = () => database.get<CategoryModel>('categories');

/** El backend exige categoryId: sin selección, usar la default (o primera)
 * de scope tareas — igual criterio que el seed de categorías. */
async function resolveTaskCategoryId(explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const rows = await categories()
    .query(Q.where('scope', 'tareas'), Q.where('is_active', true))
    .fetch();
  if (rows.length === 0) {
    throw new Error('No hay categorías de tareas; sincronizá al menos una vez');
  }
  rows.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name));
  return rows[0].id;
}

export async function createTaskLocal(dto: CreateTaskDTO): Promise<void> {
  const categoryId = await resolveTaskCategoryId(dto.categoryId);
  await database.write(async () => {
    // orderPosition = última + 1 (como el REST)
    const existing = await tasks().query(Q.where('is_active', true)).fetch();
    const orderPosition = existing.reduce((max, t) => Math.max(max, t.orderPosition + 1), 0);

    await tasks().create((t) => {
      t.categoryId = categoryId;
      t.title = dto.title;
      t.description = dto.description;
      t.priority = dto.priority ?? 'media';
      t.status = 'pendiente';
      t.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
      t.isActive = true;
      t.orderPosition = orderPosition;
      t.rescheduleCount = 0;
    });
  });
  requestSync();
}

export async function updateTaskLocal(id: string, dto: UpdateTaskDTO): Promise<void> {
  await database.write(async () => {
    const task = await tasks().find(id);
    await task.update((t) => {
      if (dto.title !== undefined) t.title = dto.title;
      if (dto.description !== undefined) t.description = dto.description;
      if (dto.categoryId !== undefined && dto.categoryId) t.categoryId = dto.categoryId;
      if (dto.priority !== undefined && dto.priority) t.priority = dto.priority;

      if (dto.dueDate !== undefined) {
        const newDue = dto.dueDate ? new Date(dto.dueDate) : undefined;
        // F-14: reprogramar (cambiar una fecha existente por otra) cuenta +1
        const oldMs = t.dueDate?.getTime() ?? null;
        const newMs = newDue?.getTime() ?? null;
        if (oldMs !== null && newMs !== null && oldMs !== newMs) {
          t.rescheduleCount = t.rescheduleCount + 1;
        }
        t.dueDate = newDue;
      }

      if (dto.status !== undefined && dto.status !== t.status) {
        const prev = t.status;
        t.status = dto.status;
        if (dto.status === 'completada') t.completedAt = new Date();
        if (dto.status === 'cancelada') t.canceledAt = new Date();
        if (prev === 'completada' && dto.status !== 'completada') {
          t.completedAt = undefined;
          t.archivedAt = undefined;
        }
        if (prev === 'cancelada' && dto.status !== 'cancelada') {
          t.canceledAt = undefined;
          t.cancelReason = undefined;
        }
      }
    });
  });
  requestSync();
}

/** POST /tasks/:id/toggle — pendiente|en_progreso ⇄ completada. */
export async function toggleTaskLocal(id: string): Promise<void> {
  await database.write(async () => {
    const task = await tasks().find(id);
    if (task.status === 'cancelada') {
      throw new Error('No se puede alternar una tarea cancelada');
    }
    await task.update((t) => {
      if (t.status === 'pendiente' || t.status === 'en_progreso') {
        t.status = 'completada';
        t.completedAt = new Date();
      } else {
        t.status = 'pendiente';
        t.completedAt = undefined;
        t.archivedAt = undefined;
      }
    });
  });
  requestSync();
}

/** Hard delete: markAsDeleted viaja como `deleted` en el push (tombstones
 * server-side); los items del checklist se borran junto con la task. */
export async function deleteTaskLocal(id: string): Promise<void> {
  await database.write(async () => {
    const task = await tasks().find(id);
    const items = await checklistItems().query(Q.where('task_id', id)).fetch();
    for (const item of items) {
      await item.markAsDeleted();
    }
    await task.markAsDeleted();
  });
  requestSync();
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

export async function addChecklistItemLocal(
  taskId: string,
  title: string
): Promise<{ id: string; title: string; completed: boolean }> {
  let created: TaskChecklistItemModel | undefined;
  await database.write(async () => {
    const siblings = await checklistItems().query(Q.where('task_id', taskId)).fetch();
    const position = siblings.reduce((max, i) => Math.max(max, i.position + 1), 0);
    created = await checklistItems().create((i) => {
      i.taskId = taskId;
      i.title = title;
      i.completed = false;
      i.position = position;
    });
  });
  requestSync();
  return { id: created!.id, title: created!.title, completed: created!.completed };
}

export async function updateChecklistItemLocal(
  itemId: string,
  dto: { title?: string; completed?: boolean }
): Promise<{ id: string; title: string; completed: boolean }> {
  let updated: TaskChecklistItemModel | undefined;
  await database.write(async () => {
    const item = await checklistItems().find(itemId);
    updated = await item.update((i) => {
      if (dto.title !== undefined) i.title = dto.title;
      if (dto.completed !== undefined) i.completed = dto.completed;
    });
  });
  requestSync();
  return { id: updated!.id, title: updated!.title, completed: updated!.completed };
}

export async function deleteChecklistItemLocal(itemId: string): Promise<void> {
  await database.write(async () => {
    const item = await checklistItems().find(itemId);
    await item.markAsDeleted();
  });
  requestSync();
}
