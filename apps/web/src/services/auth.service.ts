/**
 * Auth Service
 * Sprint 11 - US-095
 */

import { axiosInstance } from '@/lib/axios';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const { data } = await axiosInstance.get<{ user: User }>('/auth/me');
    return data;
  },

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { data } = await axiosInstance.post('/auth/refresh', { refreshToken });
    return data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout');
  },
};
