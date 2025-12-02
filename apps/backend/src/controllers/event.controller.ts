/**
 * Event Controller
 * Sprint 8 - US-066
 */

import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service.js';
import {
  createEventSchema,
  updateEventSchema,
  getEventsQuerySchema,
} from '../validations/event.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const eventController = {
  /**
   * POST /api/events
   * Creates a new event
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const validatedData = createEventSchema.parse(req.body);

      const event = await eventService.create(user.id, validatedData);

      res.status(201).json({ event });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/events
   * Gets all events for authenticated user in a date range
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const query = getEventsQuerySchema.parse(req.query);

      const events = await eventService.findAll(user.id, query);

      res.status(200).json({ events });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/events/:id
   * Gets a specific event by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const event = await eventService.findById(user.id, id);

      res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/events/:id
   * Updates an existing event
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const validatedData = updateEventSchema.parse(req.body);

      const event = await eventService.update(user.id, id, validatedData);

      res.status(200).json({ event });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/events/:id
   * Deletes an event
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const result = await eventService.delete(user.id, id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
