import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { categoryService } from '../services/category.service.js';
import { passwordResetService, PasswordResetError } from '../services/passwordReset.service.js';
import {
  emailVerificationService,
  EmailVerificationError,
} from '../services/emailVerification.service.js';
import { dataExportService } from '../services/dataExport.service.js';
import { accountDeletionService } from '../services/accountDeletion.service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  deleteAccountSchema,
} from '../validations/auth.validation.js';
import {
  BadRequestError,
  UnauthorizedError,
  TooManyRequestsError,
} from '../middlewares/error.middleware.js';
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

      // Send verification email (non-blocking: fire-and-forget so registration
      // isn't slowed or failed by email delivery).
      void emailVerificationService
        .sendVerification(user.id)
        .catch((err) => logger.error('[auth.register] verification email failed', err));

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

      // Per-account lockout: reject early if the account is temporarily locked.
      const lockRemainingMs = authService.getLockRemainingMs(user);
      if (lockRemainingMs !== null) {
        const minutes = Math.ceil(lockRemainingMs / 60000);
        throw new TooManyRequestsError(
          `Cuenta bloqueada temporalmente por intentos fallidos. Probá de nuevo en ${minutes} min.`
        );
      }

      // Compare password
      const isPasswordValid = await authService.comparePassword(
        validatedData.password,
        user.password
      );
      if (!isPasswordValid) {
        // Count the failure (may lock the account) before responding.
        await authService.recordFailedLogin(user);
        throw new UnauthorizedError('Invalid credentials');
      }

      // Successful login clears any accumulated failures / lock.
      await authService.resetLoginAttempts(user);

      // Generate tokens
      const tokens = authService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Store refresh token and stamp last login (drives inactive-account retention).
      await authService.updateRefreshToken(user.id, tokens.refreshToken, { touchLastLogin: true });

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

  /**
   * POST /api/auth/verify-email
   * Consumes a one-time token and marks the user's email as verified.
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = verifyEmailSchema.parse(req.body);
      await emailVerificationService.verifyEmail(token);
      res.status(200).json({ message: 'Email verificado exitosamente' });
    } catch (error) {
      if (error instanceof EmailVerificationError) {
        const message =
          error.reason === 'expired'
            ? 'El link de verificación expiró. Pedí uno nuevo.'
            : error.reason === 'used'
              ? 'Este link ya fue usado. Tu email puede estar verificado.'
              : 'El link de verificación es inválido. Verificá que sea el más reciente.';
        res.status(400).json({ message });
        return;
      }
      next(error);
    }
  },

  /**
   * POST /api/auth/resend-verification
   * Re-sends the verification email. Always responds 200 to avoid leaking which
   * emails are registered or already verified.
   */
  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = resendVerificationSchema.parse(req.body);

      void emailVerificationService
        .requestResend(email)
        .catch((err) => logger.error('[auth.resendVerification] background resend failed', err));

      res.status(200).json({
        message: 'Si el email existe y no está verificado, te enviamos un nuevo link.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/export
   * Returns a complete JSON snapshot of the user's data (GDPR portability).
   */
  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');

      const data = await dataExportService.exportUserData(user.id);

      const filename = `horus-export-${user.id}.json`;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(data, null, 2));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/auth/me
   * Permanently deletes the user's account and all their data. Requires the
   * current password as confirmation (re-authentication).
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionUser = req.user;
      if (!sessionUser) throw new UnauthorizedError('User not found');

      const { password } = deleteAccountSchema.parse(req.body);

      // Re-authenticate: load the full row (with password) and verify.
      const fullUser = await authService.findUserByEmail(sessionUser.email);
      if (!fullUser) throw new UnauthorizedError('User not found');

      const passwordOk = await authService.comparePassword(password, fullUser.password);
      if (!passwordOk) {
        throw new UnauthorizedError('Contraseña incorrecta');
      }

      await accountDeletionService.deleteAccount(sessionUser.id);

      res.status(200).json({ message: 'Tu cuenta y todos tus datos fueron eliminados.' });
    } catch (error) {
      next(error);
    }
  },
};
