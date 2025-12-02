/**
 * Tasks API Client
 * Sprint 7 - US-061
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// TODO: Get token from secure storage (AsyncStorage/SecureStore)
const getAuthToken = () => {
  return 'dummy-token-for-development';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type Priority = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export interface Task {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  canceledAt?: string;
  archivedAt?: string;
  cancelReason?: string;
  isActive: boolean;
  orderPosition: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    scope: string;
  };
  checklistSummary?: {
    total: number;
    completed: number;
  };
}

export interface TaskWithChecklist extends Task {
  checklistItems: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  categoryId?: string;
  dueDateFilter?: 'overdue' | 'today' | 'week' | 'month' | 'none';
}

export interface CreateTaskData {
  categoryId: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: string;
  cancelReason?: string;
}

// ==================== Tasks CRUD ====================

export const getTasks = async (filters?: TaskFilters): Promise<Task[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.categoryId) params.append('categoryId', filters.categoryId);
  if (filters?.dueDateFilter) params.append('dueDateFilter', filters.dueDateFilter);

  const response = await api.get<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
  return response.data.tasks;
};

export const getTaskById = async (id: string): Promise<TaskWithChecklist> => {
  const response = await api.get<{ task: TaskWithChecklist }>(`/tasks/${id}`);
  return response.data.task;
};

export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const response = await api.post<{ task: Task }>('/tasks', data);
  return response.data.task;
};

export const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
  const response = await api.put<{ task: Task }>(`/tasks/${id}`, data);
  return response.data.task;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const toggleTaskStatus = async (id: string): Promise<Task> => {
  const response = await api.post<{ task: Task }>(`/tasks/${id}/toggle`);
  return response.data.task;
};

// ==================== Checklist Items ====================

export const createChecklistItem = async (
  taskId: string,
  title: string
): Promise<ChecklistItem> => {
  const response = await api.post<{ item: ChecklistItem }>(`/tasks/${taskId}/checklist`, {
    title,
  });
  return response.data.item;
};

export const updateChecklistItem = async (
  taskId: string,
  itemId: string,
  data: { title?: string; completed?: boolean }
): Promise<ChecklistItem> => {
  const response = await api.put<{ item: ChecklistItem }>(
    `/tasks/${taskId}/checklist/${itemId}`,
    data
  );
  return response.data.item;
};

export const deleteChecklistItem = async (taskId: string, itemId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/checklist/${itemId}`);
};

export const reorderChecklistItems = async (
  taskId: string,
  items: Array<{ itemId: string; position: number }>
): Promise<ChecklistItem[]> => {
  const response = await api.put<{ items: ChecklistItem[] }>(`/tasks/${taskId}/checklist/reorder`, {
    items,
  });
  return response.data.items;
};
