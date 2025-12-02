/**
 * Tasks Types
 * Sprint 11 - US-101
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'alta' | 'media' | 'baja';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  checklist: ChecklistItem[];
  createdAt: string;
  completedAt?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  categoryId: string;
  checklist: Omit<ChecklistItem, 'id'>[];
}

export type TaskFilterStatus = 'all' | TaskStatus;
export type TaskFilterPriority = 'all' | TaskPriority;
export type TaskSortOption = 'dueDate' | 'priority' | 'createdAt';
