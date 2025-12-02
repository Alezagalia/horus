/**
 * Request Logger Middleware
 * Sprint 12 - US-115: Monitoring y Logging en Producción
 */

import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../lib/logger.js';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.id;

    logRequest(req.method, req.path, res.statusCode, duration, userId);
  });

  next();
};
