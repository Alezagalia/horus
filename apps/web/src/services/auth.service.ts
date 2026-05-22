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

  async updateProfile(data: {
    name?: string;
    hourlyRate?: number | null;
  }): Promise<{ user: User }> {
    const { data: res } = await axiosInstance.patch<{ user: User }>('/auth/me', data);
    return res;
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await axiosInstance.post<{ message: string }>('/auth/forgot-password', {
      email,
    });
    return data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await axiosInstance.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    });
    return data;
  },
};
