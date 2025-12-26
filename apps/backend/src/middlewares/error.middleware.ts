import { Request, Response, NextFunction } from 'express';
import * as z from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export const errorMiddleware = (
  err: AppError,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as z.ZodError;
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      statusCode: 400,
      details: zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Prisma errors (check by error code pattern)
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['field'];
      res.status(400).json({
        error: 'Duplicate Entry',
        message: `A record with this ${target.join(', ')} already exists`,
        statusCode: 400,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Not Found',
        message: 'Record not found',
        statusCode: 404,
      });
      return;
    }
  }

  // Custom app errors
  if (err.statusCode) {
    const response: ErrorResponse = {
      error: err.name || 'Error',
      message: err.message,
      statusCode: err.statusCode,
    };

    // Include meta if present (e.g., ConflictError with workoutId)
    if (err.meta) {
      response.meta = err.meta;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    statusCode: 500,
  });
};

export class HttpError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  meta?: Record<string, unknown>;

  constructor(message: string = 'Conflict', meta?: Record<string, unknown>) {
    super(409, message);
    this.meta = meta;
  }
}
