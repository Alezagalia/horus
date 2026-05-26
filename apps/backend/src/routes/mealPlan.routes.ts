/**
 * MealPlan Routes - F-17 Sprint 2
 */

import { Router, type IRouter } from 'express';
import { mealPlanController } from '../controllers/mealPlan.controller.js';
import { shoppingListController } from '../controllers/shoppingList.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

router.get('/', mealPlanController.getAll);
router.get('/by-week', mealPlanController.getByWeek);
router.get('/:id', mealPlanController.getById);
router.post('/', mealPlanController.create);
router.delete('/:id', mealPlanController.delete);
router.post('/:id/entries', mealPlanController.addEntry);
router.delete('/:id/entries/:entryId', mealPlanController.deleteEntry);
router.get('/:id/macros', mealPlanController.getMacros);
router.post('/:id/shopping-list', shoppingListController.generateFromMealPlan);

export default router;
