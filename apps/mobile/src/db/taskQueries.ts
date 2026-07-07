import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Task as TaskModel } from './models/Task';
import { TaskChecklistItem as TaskChecklistItemModel } from './models/TaskChecklistItem';
import { Category as CategoryModel } from './models/Category';
import type { Task, TaskPriority, TaskStatus } from '@/services/api/taskApi';

/**
 * Lecturas locales del dominio Tareas (offline-first Fase 2b). Devuelve el
 * shape que la UI mobile declara (categoría aplanada + checklist embebido),
 * que la web obtiene mapeando la respuesta REST (mapBackendTaskToFrontend).
 */

const tasks = () => database.get<TaskModel>('tasks');
const checklistItems = () => database.get<TaskChecklistItemModel>('task_checklist_items');
const categories = () => database.get<CategoryModel>('categories');

/** GET /tasks(?status=) — activas y no archivadas, orden REST. */
export async function listTasksLocal(filters?: { status?: string }): Promise<Task[]> {
  const clauses = [Q.where('is_active', true), Q.where('archived_at', null)];
  if (filters?.status) clauses.push(Q.where('status', filters.status));

  const rows = await tasks()
    .query(...clauses)
    .fetch();
  // Orden REST: orderPosition asc, luego createdAt desc
  rows.sort(
    (a, b) => a.orderPosition - b.orderPosition || b.createdAt.getTime() - a.createdAt.getTime()
  );

  const [categoryRows, itemRows] = await Promise.all([
    categories().query().fetch(),
    checklistItems().query().fetch(),
  ]);
  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));
  const itemsByTask = new Map<string, TaskChecklistItemModel[]>();
  for (const item of itemRows) {
    (itemsByTask.get(item.taskId) ?? itemsByTask.set(item.taskId, []).get(item.taskId)!).push(item);
  }

  return rows.map((t) => {
    const category = categoryById.get(t.categoryId);
    const checklist = (itemsByTask.get(t.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, title: i.title, completed: i.completed }));
    return {
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      status: t.status as TaskStatus,
      priority: (t.priority as TaskPriority) ?? null,
      dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
      categoryId: t.categoryId,
      categoryName: category?.name,
      categoryIcon: category?.icon ?? undefined,
      categoryColor: category?.color ?? undefined,
      checklist,
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt ? t.completedAt.toISOString() : undefined,
    };
  });
}
