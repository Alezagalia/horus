/**
 * Task API Service
 * Sprint 11 - US-101
 * Integración con backend de tareas
 */

import { axiosInstance } from '@/lib/axios';
import type { Task, TaskFormData, TaskStatus, TaskPriority } from '@/types/tasks';

// Backend types (diferentes al frontend)
type BackendTaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

interface BackendChecklistItem {
  id: string;
  taskId: string;
  title: string; // Backend usa "title" en vez de "text"
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendTask {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: BackendTaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  archivedAt: string | null;
  cancelReason: string | null;
  isActive: boolean;
  orderPosition: number;
  createdAt: string;
  updatedAt: string;
  checklistItems: BackendChecklistItem[];
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

// ==================== Mappers ====================

/**
 * Mapea status del backend al frontend
 */
function mapBackendStatusToFrontend(status: BackendTaskStatus): TaskStatus {
  const statusMap: Record<BackendTaskStatus, TaskStatus> = {
    pendiente: 'pending',
    en_progreso: 'in_progress',
    completada: 'completed',
    cancelada: 'completed', // Cancelada se trata como completada en UI
  };
  return statusMap[status];
}

/**
 * Mapea status del frontend al backend
 */
function mapFrontendStatusToBackend(status: TaskStatus): BackendTaskStatus {
  const statusMap: Record<TaskStatus, BackendTaskStatus> = {
    pending: 'pendiente',
    in_progress: 'en_progreso',
    completed: 'completada',
  };
  return statusMap[status];
}

/**
 * Mapea tarea del backend al formato del frontend
 */
function mapBackendTaskToFrontend(backendTask: BackendTask): Task {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description || undefined,
    status: mapBackendStatusToFrontend(backendTask.status),
    priority: backendTask.priority,
    dueDate: backendTask.dueDate || undefined,
    categoryId: backendTask.categoryId,
    categoryName: backendTask.category?.name || 'Sin categoría',
    categoryIcon: backendTask.category?.icon || undefined,
    categoryColor: backendTask.category?.color || undefined,
    checklist: (backendTask.checklistItems || [])
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        text: item.title, // Mapear title → text
        completed: item.completed,
      })),
    createdAt: backendTask.createdAt,
    completedAt: backendTask.completedAt || undefined,
  };
}

// ==================== API Functions ====================

export interface GetTasksFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
}

/**
 * GET /api/tasks
 * Obtiene todas las tareas del usuario con filtros opcionales
 */
export async function getTasks(filters?: GetTasksFilters): Promise<Task[]> {
  // Mapear filtros del frontend al formato del backend
  const backendFilters: Record<string, string> = {};
  if (filters?.status) {
    backendFilters.status = mapFrontendStatusToBackend(filters.status);
  }
  if (filters?.priority) {
    backendFilters.priority = filters.priority;
  }
  if (filters?.categoryId) {
    backendFilters.categoryId = filters.categoryId;
  }

  const response = await axiosInstance.get<{ tasks: BackendTask[] }>('/tasks', {
    params: backendFilters,
  });

  return response.data.tasks.map(mapBackendTaskToFrontend);
}

/**
 * GET /api/tasks/:id
 * Obtiene una tarea por ID
 */
export async function getTaskById(id: string): Promise<Task> {
  const response = await axiosInstance.get<{ task: BackendTask }>(`/tasks/${id}`);
  return mapBackendTaskToFrontend(response.data.task);
}

/**
 * POST /api/tasks
 * Crea una nueva tarea
 */
export async function createTask(data: TaskFormData): Promise<Task> {
  // Preparar payload para el backend
  // Para dueDate: usar mediodía UTC para evitar desfases de timezone al mostrar
  const payload = {
    categoryId: data.categoryId,
    title: data.title,
    description: data.description || null,
    priority: data.priority,
    dueDate: data.dueDate ? `${data.dueDate}T12:00:00.000Z` : null,
  };

  const response = await axiosInstance.post<{ task: BackendTask }>('/tasks', payload);
  const newTask = mapBackendTaskToFrontend(response.data.task);

  // Si hay checklist items, crearlos uno por uno
  // Filtrar items vacíos antes de enviar
  const validChecklistItems = (data.checklist || []).filter((item) => item.text.trim() !== '');

  if (validChecklistItems.length > 0) {
    const checklistPromises = validChecklistItems.map((item, index) =>
      axiosInstance.post(`/tasks/${newTask.id}/checklist`, {
        title: item.text.trim(),
        position: index,
      })
    );
    await Promise.all(checklistPromises);

    // Re-fetch la tarea con checklist completo
    return getTaskById(newTask.id);
  }

  return newTask;
}

/**
 * PUT /api/tasks/:id
 * Actualiza una tarea existente
 */
export async function updateTask(id: string, data: Partial<TaskFormData>): Promise<Task> {
  // Si hay checklist para sincronizar, primero obtenemos los items existentes
  // ANTES de hacer cualquier update para evitar duplicados
  let existingChecklistItems: { id: string }[] = [];
  if (data.checklist !== undefined) {
    const currentTask = await getTaskById(id);
    existingChecklistItems = currentTask.checklist.map((item) => ({ id: item.id }));
  }

  // Preparar payload para el backend
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.categoryId !== undefined) payload.categoryId = data.categoryId;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.dueDate !== undefined) {
    // Enviar la fecha como ISO string pero ajustada para mantener el día correcto
    // El input date da "YYYY-MM-DD", lo parseamos como UTC para evitar desfases de timezone
    payload.dueDate = data.dueDate ? `${data.dueDate}T12:00:00.000Z` : null;
  }

  await axiosInstance.put<{ task: BackendTask }>(`/tasks/${id}`, payload);

  // Si hay checklist, sincronizarlo
  if (data.checklist !== undefined) {
    // 1. Eliminar todos los items existentes (obtenidos ANTES del update)
    if (existingChecklistItems.length > 0) {
      await Promise.all(
        existingChecklistItems.map((item) =>
          axiosInstance.delete(`/tasks/${id}/checklist/${item.id}`)
        )
      );
    }

    // 2. Crear los nuevos items (filtrar items vacíos)
    const validItems = data.checklist.filter((item) => item.text.trim() !== '');
    if (validItems.length > 0) {
      const checklistPromises = validItems.map((item, index) =>
        axiosInstance.post(`/tasks/${id}/checklist`, {
          title: item.text.trim(),
          position: index,
        })
      );
      await Promise.all(checklistPromises);
    }
  }

  // Siempre re-fetch la tarea para obtener el estado actualizado
  return getTaskById(id);
}

/**
 * DELETE /api/tasks/:id
 * Elimina una tarea
 */
export async function deleteTask(id: string): Promise<void> {
  await axiosInstance.delete(`/tasks/${id}`);
}

/**
 * POST /api/tasks/:id/toggle
 * Alterna el estado de completado de una tarea
 */
export async function toggleTaskComplete(id: string): Promise<Task> {
  const response = await axiosInstance.post<{ task: BackendTask }>(`/tasks/${id}/toggle`);
  return mapBackendTaskToFrontend(response.data.task);
}

/**
 * PUT /api/tasks/:taskId/checklist/:itemId
 * Actualiza un item del checklist (principalmente para toggle completed)
 * @param currentCompleted - Estado actual del item (pasado desde el optimistic update)
 */
export async function toggleChecklistItem(
  taskId: string,
  itemId: string,
  currentCompleted: boolean
): Promise<void> {
  const newCompleted = !currentCompleted;

  // Toggle el estado directamente sin hacer fetch primero
  await axiosInstance.put(`/tasks/${taskId}/checklist/${itemId}`, {
    completed: newCompleted,
  });
}
