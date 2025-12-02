/**
 * Audit Value Formatters
 * Sprint 6 - US-052
 *
 * Utilities to format audit log values for human-readable display
 */

const PERIODICITY_LABELS: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  CUSTOM: 'Personalizada',
};

const TIME_OF_DAY_LABELS: Record<string, string> = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  NOCHE: 'Noche',
  ANYTIME: 'Cualquier momento',
};

const WEEK_DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const TYPE_LABELS: Record<string, string> = {
  CHECK: 'Checklist',
  NUMERIC: 'Numérico',
};

/**
 * Format periodicity value for display
 */
export const formatPeriodicity = (value: string | null): string => {
  if (!value) return '-';
  return PERIODICITY_LABELS[value] || value;
};

/**
 * Format time of day value for display
 */
export const formatTimeOfDay = (value: string | null): string => {
  if (!value) return '-';
  return TIME_OF_DAY_LABELS[value] || value;
};

/**
 * Format week days array for display
 * [1, 3, 5] -> "Lun, Mié, Vie"
 */
export const formatWeekDays = (value: number[] | null): string => {
  if (!value || !Array.isArray(value) || value.length === 0) return '-';
  return value.map((day) => WEEK_DAYS_SHORT[day] || day).join(', ');
};

/**
 * Format habit type for display
 */
export const formatHabitType = (value: string | null): string => {
  if (!value) return '-';
  return TYPE_LABELS[value] || value;
};

/**
 * Format boolean value for display
 */
export const formatBoolean = (value: boolean | null): string => {
  if (value === null || value === undefined) return '-';
  return value ? 'Sí' : 'No';
};

/**
 * Format color value with visual swatch
 * Returns an object with display text and color code
 */
export const formatColor = (value: string | null): { text: string; color: string | null } => {
  if (!value) return { text: '-', color: null };
  return { text: value, color: value };
};

/**
 * Generic formatter that handles different field types
 */
export const formatAuditValue = (
  fieldName: string | null,
  value: unknown
): { text: string; color?: string | null } => {
  if (value === null || value === undefined) {
    return { text: '-' };
  }

  // Handle based on field name
  switch (fieldName) {
    case 'periodicity':
      return { text: formatPeriodicity(typeof value === 'string' ? value : null) };

    case 'timeOfDay':
      return { text: formatTimeOfDay(typeof value === 'string' ? value : null) };

    case 'weekDays':
      return { text: formatWeekDays(Array.isArray(value) ? value : null) };

    case 'type':
      return { text: formatHabitType(typeof value === 'string' ? value : null) };

    case 'isActive':
      return { text: formatBoolean(typeof value === 'boolean' ? value : null) };

    case 'color':
      return formatColor(typeof value === 'string' ? value : null);

    case 'targetValue':
    case 'order':
    case 'currentStreak':
    case 'longestStreak':
      return { text: typeof value === 'number' ? value.toString() : String(value) };

    case 'unit':
    case 'reminderTime':
      return { text: typeof value === 'string' ? value : '-' };

    default:
      // For strings, objects, etc.
      if (typeof value === 'string') {
        return { text: value };
      }
      if (typeof value === 'boolean') {
        return { text: formatBoolean(value) };
      }
      if (typeof value === 'number') {
        return { text: value.toString() };
      }
      // For complex objects, stringify
      return { text: JSON.stringify(value) };
  }
};

/**
 * Get human-readable field name
 */
export const getFieldDisplayName = (fieldName: string | null): string => {
  if (!fieldName) return 'Cambio general';

  const fieldNames: Record<string, string> = {
    name: 'Nombre',
    description: 'Descripción',
    type: 'Tipo',
    targetValue: 'Objetivo',
    unit: 'Unidad',
    periodicity: 'Periodicidad',
    weekDays: 'Días de la semana',
    timeOfDay: 'Momento del día',
    reminderTime: 'Hora de recordatorio',
    color: 'Color',
    order: 'Orden',
    isActive: 'Estado activo',
    currentStreak: 'Racha actual',
    longestStreak: 'Racha más larga',
    categoryId: 'Categoría',
  };

  return fieldNames[fieldName] || fieldName;
};
