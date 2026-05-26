/**
 * Recipe Routes - F-17 Sprint 1
 */

import { Router, type IRouter } from 'express';
import { recipeController } from '../controllers/recipe.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', recipeController.getAll);
router.get('/:id', recipeController.getById);
router.post('/', recipeController.create);
router.put('/:id', recipeController.update);
router.delete('/:id', recipeController.delete);
router.post('/:id/ingredients', recipeController.addIngredient);
router.delete('/:id/ingredients/:ingredientId', recipeController.removeIngredient);

export default router;
