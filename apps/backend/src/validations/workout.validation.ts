/**
 * Workout Validation
 * Sprint 14 - US-128, US-129, US-130
 * Re-exports schemas from shared package for use in backend
 */

export {
  startWorkoutSchema,
  addSetSchema,
  updateSetSchema,
  updateWorkoutExerciseSchema,
  finishWorkoutSchema,
  listWorkoutsQuerySchema,
} from '@horus/shared';
