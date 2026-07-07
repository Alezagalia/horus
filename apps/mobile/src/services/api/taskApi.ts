// Offline-first Fase 2b: las tareas se leen/escriben en WatermelonDB
// (src/db/taskQueries|taskWrites) y se replican vía /api/replication.
// Quedan acá solo los tipos que consume la UI.

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type TaskPriority = 'alta' | 'media' | 'baja';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  dueDate?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  checklist: Array<{ id: string; title: string; completed: boolean }>;
  createdAt: string;
  completedAt?: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  categoryId?: string;
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: TaskStatus;
}
