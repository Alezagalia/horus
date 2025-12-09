import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
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

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sentry first (US-115)
initSentry();

const app: Application = express();

// Trust proxy for rate limiting behind reverse proxy (Railway, Render, etc.)
app.set('trust proxy', 1);

// ===========================================
// Static Frontend Files (Production) - BEFORE rate limiting
// ===========================================
// In production (Docker), frontend is copied to dist/public
// __dirname points to /app/apps/backend/dist, so ./public is correct
const frontendPath = path.join(__dirname, 'public');

// Serve static files with correct MIME types (no rate limiting for static assets)
app.use(
  express.static(frontendPath, {
    setHeaders: (res, filePath) => {
      // Ensure correct MIME types for JS modules
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    },
  })
);

// ===========================================
// Security Middlewares (for API routes)
// ===========================================

// Helmet: Security headers (XSS, clickjacking, MIME sniffing, etc.)
// Modified to allow inline scripts for SPA
app.use(
  helmet({
    ...apiHelmetOptions,
    contentSecurityPolicy: false, // Disable CSP for SPA compatibility
  })
);

// CORS: Restrict origins in production
app.use(cors(getCorsOptions()));

// Rate limiting: Prevent DoS and brute force (general) - only for non-static routes
app.use(generalLimiter);

// ===========================================
// Body Parsing Middlewares
// ===========================================
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (US-115)
app.use(requestLoggerMiddleware);

// ===========================================
// API Routes
// ===========================================
app.use('/api', routes);

// ===========================================
// SPA Fallback
// ===========================================
// SPA fallback - serve index.html for all non-API routes
// Express 5 requires named wildcard parameter syntax
app.get('/{*splat}', (req: Request, res: Response) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling (must be after SPA fallback)
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
