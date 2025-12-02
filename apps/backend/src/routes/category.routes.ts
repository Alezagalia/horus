import { Router, type IRouter } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// All category routes are protected
router.use(authMiddleware);

router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);
router.put('/:id/set-default', categoryController.setDefault);

export default router;
