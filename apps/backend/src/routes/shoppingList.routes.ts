/**
 * ShoppingList Routes - F-17 Sprint 3
 */

import { Router, type IRouter } from 'express';
import { shoppingListController } from '../controllers/shoppingList.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', shoppingListController.getAll);
router.get('/:id', shoppingListController.getById);
router.post('/', shoppingListController.create);
router.put('/:id', shoppingListController.update);
router.delete('/:id', shoppingListController.delete);
router.patch('/:id/items/:itemId', shoppingListController.checkItem);
router.post('/:id/link-transaction', shoppingListController.linkTransaction);

export default router;
