import { axiosInstance } from '../axios';

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

export const taskApi = {
  list: async (filters?: { status?: string }): Promise<Task[]> => {
    const { data } = await axiosInstance.get('/tasks', { params: filters });
    return data.tasks ?? data;
  },

  toggle: async (taskId: string): Promise<Task> => {
    const { data } = await axiosInstance.post(`/tasks/${taskId}/toggle`);
    return data.task ?? data;
  },

  create: async (dto: CreateTaskDTO): Promise<Task> => {
    const { data } = await axiosInstance.post('/tasks', dto);
    return data.task ?? data;
  },

  update: async (taskId: string, dto: UpdateTaskDTO): Promise<Task> => {
    const { data } = await axiosInstance.put(`/tasks/${taskId}`, dto);
    return data.task ?? data;
  },

  delete: async (taskId: string): Promise<void> => {
    await axiosInstance.delete(`/tasks/${taskId}`);
  },

  // ─── Checklist ───────────────────────────────────────────────────────────────

  addChecklistItem: async (
    taskId: string,
    title: string
  ): Promise<{ id: string; title: string; completed: boolean }> => {
    const { data } = await axiosInstance.post(`/tasks/${taskId}/checklist`, { title });
    return data.item ?? data;
  },

  updateChecklistItem: async (
    taskId: string,
    itemId: string,
    dto: { title?: string; completed?: boolean }
  ): Promise<{ id: string; title: string; completed: boolean }> => {
    const { data } = await axiosInstance.put(`/tasks/${taskId}/checklist/${itemId}`, dto);
    return data.item ?? data;
  },

  deleteChecklistItem: async (taskId: string, itemId: string): Promise<void> => {
    await axiosInstance.delete(`/tasks/${taskId}/checklist/${itemId}`);
  },
};
