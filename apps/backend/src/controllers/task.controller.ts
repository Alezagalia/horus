/**
 * Task Controller
 * Sprint 7 - US-057, US-058, US-060
 */

import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service.js';
import { checklistService } from '../services/checklist.service.js';
import {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema,
} from '../validations/task.validation.js';
import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
  reorderChecklistItemsSchema,
} from '../validations/checklist.validation.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

export const taskController = {
  /**
   * GET /api/tasks
   * Gets all tasks for authenticated user with optional filters
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const filters = getTasksQuerySchema.parse(req.query);

      const tasks = await taskService.findAll(user.id, filters);

      res.status(200).json({ tasks });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/tasks/:id
   * Gets a specific task by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const task = await taskService.findById(id, user.id);

      res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/tasks
   * Creates a new task
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const validatedData = createTaskSchema.parse(req.body);

      const task = await taskService.create(user.id, validatedData);

      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/tasks/:id
   * Updates an existing task
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const validatedData = updateTaskSchema.parse(req.body);

      const task = await taskService.update(id, user.id, validatedData);

      res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/tasks/:id
   * Deletes a task (physical delete with cascade to checklist items)
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const result = await taskService.delete(id, user.id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ==================== Checklist endpoints (Sprint 7 - US-058) ====================

  /**
   * POST /api/tasks/:taskId/checklist
   * Creates a new checklist item for a task
   */
  async createChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { taskId } = req.params;
      const validatedData = createChecklistItemSchema.parse(req.body);

      const item = await checklistService.createChecklistItem(taskId, user.id, validatedData);

      res.status(201).json({ item });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/tasks/:taskId/checklist/:itemId
   * Updates a checklist item
   */
  async updateChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { taskId, itemId } = req.params;
      const validatedData = updateChecklistItemSchema.parse(req.body);

      const item = await checklistService.updateChecklistItem(
        taskId,
        itemId,
        user.id,
        validatedData
      );

      res.status(200).json({ item });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/tasks/:taskId/checklist/:itemId
   * Deletes a checklist item and recalculates positions
   */
  async deleteChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { taskId, itemId } = req.params;

      await checklistService.deleteChecklistItem(taskId, itemId, user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/tasks/:taskId/checklist/reorder
   * Reorders checklist items
   */
  async reorderChecklistItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { taskId } = req.params;
      const validatedData = reorderChecklistItemsSchema.parse(req.body);

      const items = await checklistService.reorderChecklistItems(
        taskId,
        user.id,
        validatedData.items
      );

      res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  },

  // ==================== Toggle endpoint (Sprint 7 - US-060) ====================

  /**
   * POST /api/tasks/:id/toggle
   * Toggles task status between completed and pending
   *
   * Rules:
   * - pendiente/en_progreso → completada (set completedAt)
   * - completada → pendiente (clear completedAt and archivedAt)
   * - cancelada → 400 error (must be reactivated explicitly)
   */
  async toggleTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const { id } = req.params;
      const task = await taskService.toggleTaskStatus(id, user.id);

      res.status(200).json({ task });
    } catch (error) {
      next(error);
    }
  },
};
