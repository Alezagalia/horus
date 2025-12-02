/**
 * Task Color Utilities
 * Sprint 7 - US-064
 *
 * Sistema de color semáforo para tareas basado en fecha de vencimiento
 * Función compartida entre backend y frontend para consistencia
 */

import { TaskStatus, TaskColorResult } from '../types/task.types';

/**
 * Calcula el color de una tarea basándose en su estado y fecha de vencimiento
 *
 * @param dueDate - Fecha de vencimiento de la tarea (ISO string o undefined)
 * @param status - Estado actual de la tarea
 * @returns Objeto con backgroundColor, textColor y borderColor
 *
 * Sistema de colores:
 * - 🔵 Azul (#ADD8E6): Tarea vencida (overdue)
 * - 🔴 Rojo pastel (#FFB3B3): Vence en 0-2 días (urgente)
 * - 🟡 Amarillo (#FFEB9C): Vence en 3-7 días (pronto)
 * - 🟢 Verde (#C6E0B4): Vence en +7 días (tiempo suficiente)
 * - Blanco (#FFFFFF): Sin fecha de vencimiento
 * - Gris (#E0E0E0): Completada o cancelada
 *
 * @example
 * ```typescript
 * // Tarea urgente que vence mañana
 * const color = calculateTaskColor('2025-11-23T00:00:00Z', 'pendiente');
 * // { backgroundColor: '#FFB3B3', textColor: '#8B0000', borderColor: '#FF8080' }
 *
 * // Tarea completada
 * const color = calculateTaskColor('2025-11-30T00:00:00Z', 'completada');
 * // { backgroundColor: '#E0E0E0', textColor: '#666666', borderColor: '#CCCCCC' }
 * ```
 */
export function calculateTaskColor(
  dueDate: string | undefined,
  status: TaskStatus
): TaskColorResult {
  // Tareas completadas o canceladas: gris
  if (status === 'completada' || status === 'cancelada') {
    return {
      backgroundColor: '#E0E0E0',
      textColor: '#666666',
      borderColor: '#CCCCCC',
    };
  }

  // Sin fecha de vencimiento: blanco
  if (!dueDate) {
    return {
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      borderColor: '#E0E0E0',
    };
  }

  // Calcular días hasta vencimiento
  const now = new Date();
  const due = new Date(dueDate);

  // Normalizar fechas a medianoche para comparación correcta
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Sistema semáforo basado en días hasta vencimiento
  if (diffDays < 0) {
    // Vencida (overdue)
    return {
      backgroundColor: '#ADD8E6', // Azul claro
      textColor: '#003366',
      borderColor: '#6BA3D0',
    };
  } else if (diffDays <= 2) {
    // Vence en 0-2 días (urgente)
    return {
      backgroundColor: '#FFB3B3', // Rojo pastel
      textColor: '#8B0000',
      borderColor: '#FF8080',
    };
  } else if (diffDays <= 7) {
    // Vence en 3-7 días (pronto)
    return {
      backgroundColor: '#FFEB9C', // Amarillo
      textColor: '#806600',
      borderColor: '#FFD966',
    };
  } else {
    // Vence en +7 días (tiempo suficiente)
    return {
      backgroundColor: '#C6E0B4', // Verde claro
      textColor: '#2D5016',
      borderColor: '#A8D08D',
    };
  }
}

/**
 * Obtiene un texto descriptivo de la urgencia de una tarea
 *
 * @param dueDate - Fecha de vencimiento (ISO string o undefined)
 * @param status - Estado de la tarea
 * @returns Texto descriptivo o null si no aplica
 *
 * @example
 * ```typescript
 * getTaskUrgencyText('2025-11-22T00:00:00Z', 'pendiente');
 * // "Vence hoy"
 *
 * getTaskUrgencyText('2025-11-20T00:00:00Z', 'pendiente');
 * // "Vencida hace 2 días"
 *
 * getTaskUrgencyText(undefined, 'pendiente');
 * // null
 * ```
 */
export function getTaskUrgencyText(dueDate: string | undefined, status: TaskStatus): string | null {
  if (status === 'completada' || status === 'cancelada') return null;
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);

  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return daysOverdue === 1 ? 'Vencida ayer' : `Vencida hace ${daysOverdue} días`;
  } else if (diffDays === 0) {
    return 'Vence hoy';
  } else if (diffDays === 1) {
    return 'Vence mañana';
  } else if (diffDays <= 7) {
    return `Vence en ${diffDays} días`;
  } else {
    return null; // No mostrar texto para tareas con mucho tiempo
  }
}

/**
 * Formatea la fecha de vencimiento de forma relativa
 *
 * @param dueDate - Fecha de vencimiento (ISO string o undefined)
 * @returns Fecha formateada de forma relativa o null
 *
 * Formatos:
 * - "Hoy" - Si vence hoy
 * - "Mañana" - Si vence mañana
 * - "En X días" - Si vence en 2-7 días
 * - "15 Ene" - Si vence en más de 7 días
 * - "Ayer" / "Hace X días" - Si ya venció
 *
 * @example
 * ```typescript
 * formatDueDate('2025-11-22T00:00:00Z');
 * // "Hoy"
 *
 * formatDueDate('2025-11-25T00:00:00Z');
 * // "En 3 días"
 *
 * formatDueDate('2025-12-15T00:00:00Z');
 * // "15 Dic"
 * ```
 */
export function formatDueDate(dueDate: string | undefined): string | null {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate);

  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return daysOverdue === 1 ? 'Ayer' : `Hace ${daysOverdue} días`;
  } else if (diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Mañana';
  } else if (diffDays <= 7) {
    return `En ${diffDays} días`;
  } else {
    // Formato: "15 Ene"
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const day = due.getDate();
    const month = months[due.getMonth()];
    return `${day} ${month}`;
  }
}
