/**
 * Weekly Review Routes (F-03)
 * Revisión Semanal / Check-in
 */

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as reviewController from '../controllers/weeklyReview.controller.js';

const router: IRouter = Router();

router.use(authMiddleware);

// Stats & current
router.get('/stats', reviewController.getStats);
router.get('/current', reviewController.getCurrent);

// Questions CRUD (before /:id to avoid conflicts)
router.get('/questions', reviewController.listQuestions);
router.post('/questions', reviewController.createQuestion);
router.put('/questions/:id', reviewController.updateQuestion);
router.delete('/questions/:id', reviewController.removeQuestion);

// Reviews CRUD
router.get('/', reviewController.list);
router.post('/', reviewController.create);
router.put('/:id', reviewController.update);

export default router;
