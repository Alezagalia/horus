/**
 * Habit Routes
 * Sprint 3 - US-021, Sprint 4 - US-029, Sprint 6 - US-048, US-049, US-051
 */

import { Router, type IRouter } from 'express';
import { habitController } from '../controllers/habit.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routes protected with authMiddleware
router.use(authMiddleware);

// Stats routes (Sprint 5 - US-037, US-038) - Must be before /:id to avoid conflict
router.get('/stats', habitController.getStats);

// Habit CRUD routes
router.get('/', habitController.getAll);
router.get('/:id', habitController.getById);
router.get('/:id/stats', habitController.getHabitStats);
router.get('/:id/audit', habitController.getAuditHistory);
router.post('/', habitController.create);
router.post('/:id/reactivate', habitController.reactivate);
router.put('/:id', habitController.update);
router.put('/:id/notifications', habitController.updateNotificationConfig);
router.delete('/:id', habitController.delete);

// HabitRecord routes (Sprint 4 - US-029, US-030)
router.post('/:id/records', habitController.createOrUpdateRecord);
router.get('/:id/records/:date', habitController.getRecordByDate);
router.get('/:id/records', habitController.getRecordsByDateRange);

// Retroactive marking with full streak recalculation (Sprint 5 - US-040)
router.post('/:id/records/retroactive', habitController.markRetroactively);

// Historical records with pagination (Sprint 5 - US-039)
router.get('/:id/history', habitController.getHistoricalRecords);

// Alternative endpoint for retroactive marking (Sprint 4 - US-030)
router.put('/:id/daily/:date', habitController.markHabitForSpecificDate);

// Incremental progress update for NUMERIC habits (Sprint 4 - US-032)
router.put('/:id/daily/:date/progress', habitController.updateProgress);

export default router;
