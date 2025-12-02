/**
 * Task Routes
 * Sprint 7 - US-057, US-058, US-060
 */

import { Router, type IRouter } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routes protected with authMiddleware
router.use(authMiddleware);

// Task CRUD routes
router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.delete);

// Toggle task status (Sprint 7 - US-060)
router.post('/:id/toggle', taskController.toggleTaskStatus);

// Checklist routes (Sprint 7 - US-058)
// Note: PUT reorder must be before /:itemId to avoid route conflict
router.put('/:taskId/checklist/reorder', taskController.reorderChecklistItems);
router.post('/:taskId/checklist', taskController.createChecklistItem);
router.put('/:taskId/checklist/:itemId', taskController.updateChecklistItem);
router.delete('/:taskId/checklist/:itemId', taskController.deleteChecklistItem);

export default router;
