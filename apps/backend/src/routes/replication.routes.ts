import { Router, type IRouter } from 'express';
import { replicationController } from '../controllers/replication.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// Replicación offline-first (WatermelonDB). Protegido por auth.
router.use(authMiddleware);

router.get('/pull', replicationController.pull);
router.post('/push', replicationController.push);

export default router;
