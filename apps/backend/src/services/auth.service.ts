import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { categoryService } from './category.service.js';

const SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  },

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  },

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async createUser(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<UserWithoutPassword> {
    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Seed default categories (US-019)
    // Don't block registration if seed fails, just log error
    try {
      await categoryService.createDefaultCategories(user.id);
    } catch (error) {
      console.error(`[US-019] Failed to seed default categories for user ${user.id}:`, error);
      // Continue with registration - user can create categories manually
    }

    return user;
  },

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  },

  excludePassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};
