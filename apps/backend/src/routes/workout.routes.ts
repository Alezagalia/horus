/**
 * Workout Routes
 * Sprint 14 - US-128, US-129, US-130
 */

import { Router, type IRouter } from 'express';
import { workoutController } from '../controllers/workout.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All workout routes are protected
router.use(authMiddleware);

// Start workout from a routine (US-128)
router.post('/routines/:id/start', workoutController.startWorkout);

// Set management (US-129)
router.post('/:workoutId/exercises/:exerciseId/sets', workoutController.addSet);
router.put('/:workoutId/exercises/:exerciseId/sets/:setId', workoutController.updateSet);
router.delete('/:workoutId/exercises/:exerciseId/sets/:setId', workoutController.deleteSet);

// Update workout exercise metadata (US-129)
router.put('/:workoutId/exercises/:exerciseId', workoutController.updateWorkoutExercise);

// Finish workout (US-130)
router.put('/:id/finish', workoutController.finishWorkout);

// Get workout detail (US-130)
router.get('/:id', workoutController.getWorkoutById);

// List workouts with filters (US-130)
router.get('/', workoutController.listWorkouts);

export default router;
