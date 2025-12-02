/**
 * Habit Validation Helpers
 * Sprint 3 - US-027 (TECH-002)
 *
 * Utility functions for common habit validations
 * Used in backend HabitService and mobile HabitFormScreen
 */

import { HabitType, Periodicity } from '../types/habit.types';

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates weekDays array
 *
 * Rules:
 * - Must be an array
 * - All elements must be integers between 0 and 6 (0 = Sunday, 6 = Saturday)
 * - No duplicates
 * - Maximum 7 days
 *
 * @param weekDays - Array of weekday numbers
 * @returns ValidationResult with isValid flag and optional error message
 *
 * @example
 * validateWeekDays([1, 2, 3]) // { isValid: true }
 * validateWeekDays([1, 1, 2]) // { isValid: false, error: "Duplicate weekdays are not allowed" }
 * validateWeekDays([7]) // { isValid: false, error: "Weekday must be between 0 and 6" }
 */
export function validateWeekDays(weekDays: unknown): ValidationResult {
  // Check if it's an array
  if (!Array.isArray(weekDays)) {
    return {
      isValid: false,
      error: 'Week days must be an array',
    };
  }

  // Check max length
  if (weekDays.length > 7) {
    return {
      isValid: false,
      error: 'Maximum 7 weekdays allowed',
    };
  }

  // Check each element
  for (const day of weekDays) {
    // Check if it's a number
    if (typeof day !== 'number' || !Number.isInteger(day)) {
      return {
        isValid: false,
        error: 'All weekdays must be integers',
      };
    }

    // Check range (0-6)
    if (day < 0 || day > 6) {
      return {
        isValid: false,
        error: 'Weekday must be between 0 and 6',
      };
    }
  }

  // Check for duplicates
  const uniqueDays = new Set(weekDays);
  if (uniqueDays.size !== weekDays.length) {
    return {
      isValid: false,
      error: 'Duplicate weekdays are not allowed',
    };
  }

  return { isValid: true };
}

/**
 * Validates periodicity with weekDays
 *
 * Rules:
 * - DAILY: weekDays can be empty (applies every day) or specific days
 * - WEEKLY: weekDays must have at least 1 day selected
 * - MONTHLY: weekDays should be empty (monthly habits don't use weekDays)
 * - CUSTOM: weekDays must have at least 1 day selected
 *
 * @param periodicity - The periodicity value
 * @param weekDays - Array of selected weekdays
 * @returns ValidationResult with isValid flag and optional error message
 *
 * @example
 * validatePeriodicity('DAILY', []) // { isValid: true }
 * validatePeriodicity('WEEKLY', []) // { isValid: false, error: "WEEKLY habits must have at least one weekday selected" }
 * validatePeriodicity('WEEKLY', [1, 3, 5]) // { isValid: true }
 * validatePeriodicity('MONTHLY', []) // { isValid: true }
 */
export function validatePeriodicity(periodicity: unknown, weekDays: unknown): ValidationResult {
  // Validate periodicity value
  const validPeriodicities: string[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'];
  if (typeof periodicity !== 'string' || !validPeriodicities.includes(periodicity)) {
    return {
      isValid: false,
      error: 'Invalid periodicity value',
    };
  }

  // Validate weekDays format first
  const weekDaysValidation = validateWeekDays(weekDays);
  if (!weekDaysValidation.isValid) {
    return weekDaysValidation;
  }

  const days = weekDays as number[];

  // Check specific periodicity rules
  switch (periodicity as Periodicity) {
    case Periodicity.DAILY:
      // DAILY can have empty weekDays (every day) or specific days
      return { isValid: true };

    case Periodicity.WEEKLY:
      // WEEKLY must have at least 1 day
      if (days.length === 0) {
        return {
          isValid: false,
          error: 'WEEKLY habits must have at least one weekday selected',
        };
      }
      return { isValid: true };

    case Periodicity.MONTHLY:
      // MONTHLY should have empty weekDays
      if (days.length > 0) {
        return {
          isValid: false,
          error: 'MONTHLY habits should not have weekdays selected',
        };
      }
      return { isValid: true };

    case Periodicity.CUSTOM:
      // CUSTOM must have at least 1 day
      if (days.length === 0) {
        return {
          isValid: false,
          error: 'CUSTOM habits must have at least one weekday selected',
        };
      }
      return { isValid: true };

    default:
      return {
        isValid: false,
        error: 'Unknown periodicity type',
      };
  }
}

/**
 * Validates numeric habit configuration
 *
 * Rules:
 * - NUMERIC habits must have targetValue defined
 * - targetValue must be a positive integer
 * - unit is optional but recommended
 * - CHECK habits should not have targetValue
 *
 * @param habitType - The habit type (CHECK or NUMERIC)
 * @param targetValue - Target value for numeric habits
 * @param unit - Optional unit for the target value
 * @returns ValidationResult with isValid flag and optional error message
 *
 * @example
 * validateNumericHabit('NUMERIC', 10, 'km') // { isValid: true }
 * validateNumericHabit('NUMERIC', undefined) // { isValid: false, error: "NUMERIC habits must have a target value" }
 * validateNumericHabit('NUMERIC', -5, 'reps') // { isValid: false, error: "Target value must be a positive number" }
 * validateNumericHabit('CHECK', undefined) // { isValid: true }
 * validateNumericHabit('CHECK', 10) // { isValid: false, error: "CHECK habits should not have a target value" }
 */
export function validateNumericHabit(
  habitType: unknown,
  targetValue: unknown,
  unit?: unknown
): ValidationResult {
  // Validate habitType value
  const validTypes: string[] = ['CHECK', 'NUMERIC'];
  if (typeof habitType !== 'string' || !validTypes.includes(habitType)) {
    return {
      isValid: false,
      error: 'Invalid habit type',
    };
  }

  const type = habitType as HabitType;

  // Validate based on type
  if (type === HabitType.NUMERIC) {
    // NUMERIC habits must have targetValue
    if (targetValue === undefined || targetValue === null) {
      return {
        isValid: false,
        error: 'NUMERIC habits must have a target value',
      };
    }

    // targetValue must be a number
    if (typeof targetValue !== 'number') {
      return {
        isValid: false,
        error: 'Target value must be a number',
      };
    }

    // targetValue must be an integer
    if (!Number.isInteger(targetValue)) {
      return {
        isValid: false,
        error: 'Target value must be an integer',
      };
    }

    // targetValue must be positive
    if (targetValue <= 0) {
      return {
        isValid: false,
        error: 'Target value must be a positive number',
      };
    }

    // Validate unit if provided
    if (unit !== undefined && unit !== null) {
      if (typeof unit !== 'string') {
        return {
          isValid: false,
          error: 'Unit must be a string',
        };
      }

      if (unit.trim().length === 0) {
        return {
          isValid: false,
          error: 'Unit cannot be empty',
        };
      }

      if (unit.length > 20) {
        return {
          isValid: false,
          error: 'Unit must be 20 characters or less',
        };
      }
    }

    return { isValid: true };
  } else if (type === HabitType.CHECK) {
    // CHECK habits should not have targetValue
    if (targetValue !== undefined && targetValue !== null) {
      return {
        isValid: false,
        error: 'CHECK habits should not have a target value',
      };
    }

    // CHECK habits should not have unit
    if (unit !== undefined && unit !== null && unit !== '') {
      return {
        isValid: false,
        error: 'CHECK habits should not have a unit',
      };
    }

    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Unknown habit type',
  };
}

/**
 * Validates a complete habit configuration
 *
 * Combines all validation rules for a comprehensive check
 *
 * @param config - Habit configuration object
 * @returns ValidationResult with isValid flag and optional error message
 *
 * @example
 * validateHabitConfig({
 *   type: 'NUMERIC',
 *   targetValue: 10,
 *   unit: 'km',
 *   periodicity: 'WEEKLY',
 *   weekDays: [1, 3, 5]
 * }) // { isValid: true }
 */
export function validateHabitConfig(config: {
  type: unknown;
  targetValue?: unknown;
  unit?: unknown;
  periodicity: unknown;
  weekDays: unknown;
}): ValidationResult {
  // Validate numeric habit configuration
  const numericValidation = validateNumericHabit(config.type, config.targetValue, config.unit);
  if (!numericValidation.isValid) {
    return numericValidation;
  }

  // Validate periodicity with weekDays
  const periodicityValidation = validatePeriodicity(config.periodicity, config.weekDays);
  if (!periodicityValidation.isValid) {
    return periodicityValidation;
  }

  return { isValid: true };
}
