/**
 * Date Utilities
 * Sprint 9 - US-S9-008
 *
 * Utilities for date formatting and display
 */

/**
 * Format date in short format (DD/MM/YYYY)
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date in medium format (DD MMM YYYY)
 */
export const formatDateMedium = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('es-AR', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format date in long format (DD de MMMM de YYYY)
 */
export const formatDateLong = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format date relative to today (Hoy, Ayer, DD/MM)
 */
export const formatDateRelative = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time parts for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Hoy';
  }

  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Ayer';
  }

  // If within current year, omit year
  if (date.getFullYear() === today.getFullYear()) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  // Otherwise show full date
  return formatDateShort(dateString);
};

/**
 * Get month name in Spanish
 */
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return months[monthIndex] || '';
};

/**
 * Group dates by month/year header (Diciembre 2025, Enero 2025)
 */
export const formatMonthYearHeader = (dateString: string): string => {
  const date = new Date(dateString);
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear();
  return `${month} ${year}`;
};

/**
 * Check if date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is within the last N days
 */
export const isWithinDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
};
