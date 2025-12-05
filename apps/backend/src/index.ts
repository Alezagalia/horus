import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { scheduleAutoCompleteJob } from './jobs/auto-complete-habits.job.js';
import { scheduleArchiveTasksJob } from './jobs/archive-tasks.job.js';
import { scheduleMonthlyExpenseGeneration } from './jobs/generate-monthly-expenses.job.js';
import { initializeFirebaseAdmin } from './lib/firebase-admin.js';
import { initSentry } from './lib/sentry.js';
import { logInfo, logError } from './lib/logger.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';
import { generalLimiter } from './middlewares/rate-limit.middleware.js';
import { getCorsOptions, apiHelmetOptions } from './config/security.js';

// Initialize Sentry first (US-115)
initSentry();

const app: Application = express();

// ===========================================
// Security Middlewares
// ===========================================

// Helmet: Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet(apiHelmetOptions));

// CORS: Restrict origins in production
app.use(cors(getCorsOptions()));

// Rate limiting: Prevent DoS and brute force (general)
app.use(generalLimiter);

// Trust proxy for rate limiting behind reverse proxy (Railway, Render, etc.)
app.set('trust proxy', 1);

// ===========================================
// Body Parsing Middlewares
// ===========================================
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (US-115)
app.use(requestLoggerMiddleware);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

// Start server
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  logInfo(`Server running on port ${PORT}`, { port: PORT }); // US-115
  logInfo(`Environment: ${env.NODE_ENV}`, { environment: env.NODE_ENV }); // US-115

  // Initialize Firebase Admin SDK
  try {
    initializeFirebaseAdmin(); // US-105
    logInfo('Firebase Admin SDK initialized'); // US-115
  } catch (error) {
    logError('Failed to initialize Firebase Admin SDK', error as Error); // US-115
  }

  // Schedule cron jobs
  try {
    scheduleAutoCompleteJob(); // US-036
    scheduleArchiveTasksJob(); // US-059
    scheduleMonthlyExpenseGeneration(); // US-093
    logInfo('Cron jobs scheduled successfully'); // US-115
  } catch (error) {
    logError('Failed to schedule cron jobs', error as Error); // US-115
  }
});

export default app;
