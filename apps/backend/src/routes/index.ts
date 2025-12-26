import { Router, type IRouter } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import habitRoutes from './habit.routes.js';
import taskRoutes from './task.routes.js';
import eventRoutes from './event.routes.js';
import syncRoutes from './sync.routes.js';
import accountRoutes from './account.routes.js';
import transactionRoutes from './transaction.routes.js';
import financeRoutes from './finance.routes.js';
import recurringExpenseRoutes from './recurringExpense.routes.js';
import monthlyExpenseRoutes from './monthlyExpense.routes.js';
import adminRoutes from './admin.routes.js';
import pushRoutes from './push.routes.js';
import exerciseRoutes from './exercise.routes.js';
import routineRoutes from './routine.routes.js';
import workoutRoutes from './workout.routes.js';
import statsRoutes from './stats.routes.js';
import resourceRoutes from './resource.routes.js';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/habits', habitRoutes);
router.use('/tasks', taskRoutes);
router.use('/events', eventRoutes);
router.use('/sync', syncRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/finance', financeRoutes);
router.use('/recurring-expenses', recurringExpenseRoutes);
router.use('/monthly-expenses', monthlyExpenseRoutes);
router.use('/admin', adminRoutes);
router.use('/push', pushRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/routines', routineRoutes);
router.use('/workouts', workoutRoutes);
router.use('/stats', statsRoutes);
router.use('/resources', resourceRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
