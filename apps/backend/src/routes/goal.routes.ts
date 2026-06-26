/**
 * Goal Routes
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { enforceLimit } from '../middlewares/entitlements.middleware.js';
import * as goalController from '../controllers/goal.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

// Goals CRUD
router.get('/', goalController.list);
router.get('/featured', goalController.getFeatured);
router.get('/:id', goalController.getById);
router.post('/', enforceLimit('goals'), goalController.create);
router.put('/:id', goalController.update);
router.put('/:id/feature', goalController.feature);
router.delete('/:id', goalController.remove);

// Key Results
router.post('/:id/key-results', goalController.createKR);
router.put('/:id/key-results/:krId', goalController.updateKR);
router.delete('/:id/key-results/:krId', goalController.removeKR);

// Link / unlink habits
router.post('/:id/habits/:habitId', goalController.linkHabit);
router.delete('/:id/habits/:habitId', goalController.unlinkHabit);

// Link / unlink tasks
router.post('/:id/tasks/:taskId', goalController.linkTask);
router.delete('/:id/tasks/:taskId', goalController.unlinkTask);

export default router;
