/**
 * Event Routes
 * Sprint 8 - US-066
 */

import { Router, type IRouter } from 'express';
import { eventController } from '../controllers/event.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routes protected with authMiddleware
router.use(authMiddleware);

// Event CRUD routes
router.get('/', eventController.getAll);
router.get('/:id', eventController.getById);
router.post('/', eventController.create);
router.put('/:id', eventController.update);
router.delete('/:id', eventController.delete);

export default router;
