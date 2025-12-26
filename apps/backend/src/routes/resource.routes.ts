import { Router } from 'express';
import { resourceController } from '../controllers/resource.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD básico
router.post('/', resourceController.create.bind(resourceController));
router.get('/', resourceController.getAll.bind(resourceController));
router.get('/search', resourceController.search.bind(resourceController)); // ANTES de /:id
router.get('/tags', resourceController.getTags.bind(resourceController));
router.get('/stats', resourceController.getStats.bind(resourceController));
router.get('/:id', resourceController.getById.bind(resourceController));
router.put('/:id', resourceController.update.bind(resourceController));
router.delete('/:id', resourceController.delete.bind(resourceController));

// Acciones especiales
router.patch('/:id/pin', resourceController.togglePin.bind(resourceController));

export default router;
