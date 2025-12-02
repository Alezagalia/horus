/**
 * Workout Controller
 * Sprint 14 - US-128, US-129, US-130
 */

import { Request, Response, NextFunction } from 'express';
import { workoutService } from '../services/workout.service.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';
import {
  addSetSchema,
  updateSetSchema,
  updateWorkoutExerciseSchema,
  finishWorkoutSchema,
  listWorkoutsQuerySchema,
} from '../validations/workout.validation.js';

export const workoutController = {
  async startWorkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: routineId } = req.params;

      const result = await workoutService.startWorkout(user.id, routineId);

      res.status(201).json({
        message: 'Workout started successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  async addSet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { workoutId, exerciseId } = req.params;
      const data = addSetSchema.parse(req.body);

      const set = await workoutService.addSet(user.id, workoutId, exerciseId, data);

      res.status(201).json({
        message: 'Set added successfully',
        set,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { workoutId, exerciseId, setId } = req.params;
      const data = updateSetSchema.parse(req.body);

      const set = await workoutService.updateSet(user.id, workoutId, exerciseId, setId, data);

      res.status(200).json({
        message: 'Set updated successfully',
        set,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteSet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { workoutId, exerciseId, setId } = req.params;

      await workoutService.deleteSet(user.id, workoutId, exerciseId, setId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async updateWorkoutExercise(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { workoutId, exerciseId } = req.params;
      const data = updateWorkoutExerciseSchema.parse(req.body);

      const result = await workoutService.updateWorkoutExercise(
        user.id,
        workoutId,
        exerciseId,
        data
      );

      res.status(200).json({
        message: 'Workout exercise updated successfully',
        workoutExercise: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async finishWorkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: workoutId } = req.params;
      const data = finishWorkoutSchema.parse(req.body);

      const result = await workoutService.finishWorkout(user.id, workoutId, data);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getWorkoutById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id: workoutId } = req.params;

      const result = await workoutService.getWorkoutById(user.id, workoutId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listWorkouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const query = listWorkoutsQuerySchema.parse(req.query);

      const result = await workoutService.listWorkouts(user.id, query);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
