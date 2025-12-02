/**
 * Task Types
 * Sprint 7 - US-064
 *
 * Tipos compartidos para el sistema de tareas
 */

/**
 * Prioridad de una tarea
 */
export type TaskPriority = 'alta' | 'media' | 'baja';

/**
 * Estado de una tarea
 */
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

/**
 * Resultado del cálculo de color para una tarea
 */
export interface TaskColorResult {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}
