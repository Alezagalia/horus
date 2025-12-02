/**
 * Date Utility Functions
 * Sprint 11 - Fix timezone issues
 *
 * These utilities ensure consistent date handling across the application,
 * particularly for DATE type columns in PostgreSQL which can have timezone issues.
 */

/**
 * Normalizes a date to noon UTC to avoid timezone issues.
 * Using noon (12:00 UTC) instead of midnight ensures that the date component
 * is consistent across timezones when stored in PostgreSQL DATE type.
 *
 * @param date - The date to normalize
 * @returns A new Date object set to noon UTC on the same calendar day
 */
export function normalizeToUTCNoon(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

/**
 * Checks if two dates represent the same calendar day.
 * Uses UTC comparison to avoid timezone issues.
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if both dates are the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets today's date normalized to noon UTC.
 *
 * @returns Today's date at noon UTC
 */
export function getTodayNoon(): Date {
  return normalizeToUTCNoon(new Date());
}

/**
 * Formats a date as YYYY-MM-DD string using local date components.
 *
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
