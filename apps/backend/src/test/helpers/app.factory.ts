import express, { type Router } from 'express';
import { errorMiddleware } from '../../middlewares/error.middleware.js';

/**
 * Creates a minimal Express app for route integration tests.
 * Only mounts the specified routers + errorMiddleware — does NOT import index.ts.
 */
export function createTestApp(...routes: Array<[string, Router]>) {
  const app = express();
  app.use(express.json());

  for (const [path, router] of routes) {
    app.use(path, router);
  }

  app.use(errorMiddleware);
  return app;
}
