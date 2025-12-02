import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  errorMiddleware,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  AppError,
} from './error.middleware.js';

// Mock request and response
const mockRequest = {} as Request;

const createMockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = vi.fn();

describe('Error Middleware', () => {
  describe('Zod Validation Errors', () => {
    it('should handle ZodError with proper format', () => {
      const res = createMockResponse();

      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      let zodError: z.ZodError | null = null;
      try {
        schema.parse({ email: 'invalid', password: '123' });
      } catch (err) {
        zodError = err as z.ZodError;
      }

      errorMiddleware(zodError as unknown as AppError, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: 'Invalid input data',
          statusCode: 400,
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' }),
          ]),
        })
      );
    });
  });

  describe('Prisma Errors', () => {
    it('should handle P2002 duplicate entry error', () => {
      const res = createMockResponse();
      const prismaError: AppError = {
        name: 'PrismaClientKnownRequestError',
        message: 'Unique constraint failed',
        code: 'P2002',
        meta: { target: ['email'] },
      };

      errorMiddleware(prismaError, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Duplicate Entry',
        message: 'A record with this email already exists',
        statusCode: 400,
      });
    });

    it('should handle P2025 not found error', () => {
      const res = createMockResponse();
      const prismaError: AppError = {
        name: 'PrismaClientKnownRequestError',
        message: 'Record not found',
        code: 'P2025',
      };

      errorMiddleware(prismaError, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Record not found',
        statusCode: 404,
      });
    });
  });

  describe('Custom HTTP Errors', () => {
    it('should handle BadRequestError', () => {
      const res = createMockResponse();
      const error = new BadRequestError('Invalid input');

      errorMiddleware(error, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'BadRequestError',
        message: 'Invalid input',
        statusCode: 400,
      });
    });

    it('should handle UnauthorizedError', () => {
      const res = createMockResponse();
      const error = new UnauthorizedError('Invalid credentials');

      errorMiddleware(error, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'UnauthorizedError',
        message: 'Invalid credentials',
        statusCode: 401,
      });
    });

    it('should handle NotFoundError', () => {
      const res = createMockResponse();
      const error = new NotFoundError('User not found');

      errorMiddleware(error, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'NotFoundError',
        message: 'User not found',
        statusCode: 404,
      });
    });

    it('should handle ConflictError', () => {
      const res = createMockResponse();
      const error = new ConflictError('Resource already exists');

      errorMiddleware(error, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ConflictError',
        message: 'Resource already exists',
        statusCode: 409,
      });
    });

    it('should use default messages for HTTP errors', () => {
      const res = createMockResponse();
      const error = new BadRequestError();

      errorMiddleware(error, mockRequest, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Bad Request',
        })
      );
    });
  });

  describe('Generic Errors', () => {
    it('should handle unknown errors with 500 status', () => {
      const res = createMockResponse();
      const error: AppError = new Error('Something unexpected');

      errorMiddleware(error, mockRequest, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Something unexpected',
        statusCode: 500,
      });
    });
  });

  describe('HttpError Class', () => {
    it('should create HttpError with correct properties', () => {
      const error = new HttpError(418, "I'm a teapot");

      expect(error.statusCode).toBe(418);
      expect(error.message).toBe("I'm a teapot");
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('HttpError');
    });
  });
});
