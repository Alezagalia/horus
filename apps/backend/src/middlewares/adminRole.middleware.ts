import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from './error.middleware.js';

/**
 * Restricts a route to users with the ADMIN role.
 *
 * Must run AFTER `authMiddleware`, which loads `req.user` (including `role`)
 * from the database. Returns 401 if there is no authenticated user and 403 if
 * the user is authenticated but not an admin.
 */
export const adminRoleMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('No token provided'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin privileges required'));
  }

  next();
};
