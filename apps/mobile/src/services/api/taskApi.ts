import { axiosInstance } from '../axios';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type TaskPriority = 'alta' | 'media' | 'baja' | null;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number | null;
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
  priority?: number | null;
  dueDate?: string;
  categoryId?: string;
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

  delete: async (taskId: string): Promise<void> => {
    await axiosInstance.delete(`/tasks/${taskId}`);
  },
};
