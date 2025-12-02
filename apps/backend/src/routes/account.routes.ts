/**
 * Account Routes
 * Sprint 9 - US-074
 */

import { Router, type IRouter } from 'express';
import { accountController } from '../controllers/account.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All routes protected with authMiddleware
router.use(authMiddleware);

// Account CRUD routes
router.get('/', accountController.getAll);
router.get('/:id', accountController.getById);
router.post('/', accountController.create);
router.put('/:id', accountController.update);
router.put('/:id/deactivate', accountController.deactivate);

export default router;
