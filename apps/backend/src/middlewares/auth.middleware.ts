import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError } from './error.middleware.js';
import { prisma } from '../lib/prisma.js';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    // Check Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Token format invalid');
    }

    const token = parts[1];

    // Verify token
    let payload;
    try {
      payload = authService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Add user to request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
