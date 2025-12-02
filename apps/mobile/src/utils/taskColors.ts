/**
 * Task Color Utilities
 * Sprint 7 - US-061, refactored in US-064
 *
 * Re-export de funciones compartidas desde @horus/shared
 * Wrapper con compatibilidad para interfaz Task de mobile
 */

import {
  calculateTaskColor,
  getTaskUrgencyText as getUrgencyText,
  formatDueDate as formatDate,
} from '@horus/shared';
import { Task } from '../api/tasks.api';

// Re-export tipos desde shared
export type { TaskColorResult } from '@horus/shared';

/**
 * Wrapper de calculateTaskColor para aceptar objeto Task completo
 * Mantiene compatibilidad con código existente en mobile
 */
export const calcularColorTarea = (task: Task) => {
  return calculateTaskColor(task.dueDate, task.status);
};

/**
 * Wrapper de getTaskUrgencyText para aceptar objeto Task completo
 * Mantiene compatibilidad con código existente en mobile
 */
export const getTaskUrgencyText = (task: Task): string | null => {
  return getUrgencyText(task.dueDate, task.status);
};

/**
 * Re-export directo de formatDueDate
 */
export { formatDate as formatDueDate };
