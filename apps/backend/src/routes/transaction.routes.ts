/**
 * Transaction Routes
 * Sprint 9 - US-075
 */

import { Router, type IRouter } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routes protected with authMiddleware
router.use(authMiddleware);

// Stats routes (must come BEFORE /:id routes)
router.get('/stats/by-category', transactionController.getExpensesByCategory);

// Transfer routes (must come BEFORE /:id routes)
router.post('/transfer', transactionController.createTransfer);
router.put('/transfer/:id', transactionController.updateTransfer);

// Transaction CRUD routes
router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);
router.post('/', transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.delete);

export default router;
