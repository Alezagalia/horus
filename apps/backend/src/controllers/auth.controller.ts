import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { categoryService } from '../services/category.service.js';
import { passwordResetService, PasswordResetError } from '../services/passwordReset.service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation.js';
import { BadRequestError, UnauthorizedError } from '../middlewares/error.middleware.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await authService.findUserByEmail(validatedData.email);
      if (existingUser) {
        throw new BadRequestError('Email already registered');
      }

      // Create user
      const user = await authService.createUser(validatedData);

      // Generate tokens
      const tokens = authService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Store refresh token
      await authService.updateRefreshToken(user.id, tokens.refreshToken);

      // Create default categories for new user
      await categoryService.createDefaultCategories(user.id);

      // Send response
      res.status(201).json({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Find user by email
      const user = await authService.findUserByEmail(validatedData.email);
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Compare password
      const isPasswordValid = await authService.comparePassword(
        validatedData.password,
        user.password
      );
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const tokens = authService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Store refresh token
      await authService.updateRefreshToken(user.id, tokens.refreshToken);

      // Send response without password
      const userWithoutPassword = authService.excludePassword(user);

      res.status(200).json({
        user: userWithoutPassword,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate input
      const validatedData = refreshTokenSchema.parse(req.body);

      // Verify refresh token
      let payload;
      try {
        payload = authService.verifyRefreshToken(validatedData.refreshToken);
      } catch {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Find user and verify refresh token matches
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          refreshToken: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Verify that the refresh token matches the one stored in DB
      if (user.refreshToken !== validatedData.refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = authService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Update refresh token in DB
      await authService.updateRefreshToken(user.id, tokens.refreshToken);

      // Send response
      res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is already loaded by authMiddleware
      const user = req.user;

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await authService.updateProfile(user.id, validatedData);

      res.status(200).json({ user: updated });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is already loaded by authMiddleware
      const user = req.user;

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Invalidate refresh token in DB
      await authService.updateRefreshToken(user.id, null);

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Sends a reset link by email. Always responds 200 to avoid leaking which
   * emails are registered. Email delivery happens best-effort in the background.
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      // Fire-and-forget so the response time doesn't reveal whether the email
      // exists (otherwise a hit takes ~hundreds of ms more than a miss).
      void passwordResetService
        .requestReset(email)
        .catch((err) => logger.error('[auth.forgotPassword] background reset request failed', err));

      res.status(200).json({
        message: 'Si el email existe, te enviaremos un link para restablecer tu contraseña.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Consumes a one-time token and updates the user's password.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      await passwordResetService.resetPassword(token, password);
      res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      if (error instanceof PasswordResetError) {
        // Map all token errors to a generic 400 to avoid signal about token state.
        const message =
          error.reason === 'expired'
            ? 'El link expiró. Pedí uno nuevo desde el login.'
            : error.reason === 'used'
              ? 'Este link ya fue usado. Pedí uno nuevo si lo necesitás.'
              : 'El link es inválido. Verificá que sea el más reciente.';
        res.status(400).json({ message });
        return;
      }
      next(error);
    }
  },
};
