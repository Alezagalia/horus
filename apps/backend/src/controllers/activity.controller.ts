import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';
import {
  createActivitySchema,
  updateActivitySchema,
  toggleActivityRecordSchema,
  getActivitiesQuerySchema,
} from '../validations/activity.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const activityController = {
  async getActivitiesForDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const { date } = getActivitiesQuerySchema.parse(req.query);
      const activities = await activityService.getActivitiesForDate(user.id, date ?? today());

      res.status(200).json({ activities });
    } catch (error) {
      next(error);
    }
  },

  async getAllActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const activities = await activityService.getAllActivities(user.id);
      res.status(200).json({ activities });
    } catch (error) {
      next(error);
    }
  },

  async getActivityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const activity = await activityService.getActivityById(user.id, req.params.id);
      res.status(200).json({ activity });
    } catch (error) {
      next(error);
    }
  },

  async createActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = createActivitySchema.parse(req.body);
      const activity = await activityService.createActivity(user.id, data);
      res.status(201).json({ activity });
    } catch (error) {
      next(error);
    }
  },

  async updateActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = updateActivitySchema.parse(req.body);
      const activity = await activityService.updateActivity(user.id, req.params.id, data);
      res.status(200).json({ activity });
    } catch (error) {
      next(error);
    }
  },

  async deleteActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      await activityService.deleteActivity(user.id, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async toggleRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = toggleActivityRecordSchema.parse(req.body);
      const record = await activityService.toggleRecord(user.id, req.params.id, data);
      res.status(200).json({ record });
    } catch (error) {
      next(error);
    }
  },
};
