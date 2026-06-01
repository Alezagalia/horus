import { Router, type IRouter } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

router.use(authMiddleware);

// Must be before /:id
router.get('/all', activityController.getAllActivities);

router.get('/', activityController.getActivitiesForDate);
router.get('/:id', activityController.getActivityById);
router.post('/', activityController.createActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);
router.post('/:id/records', activityController.toggleRecord);

export default router;
