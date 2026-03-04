/**
 * Auth API Service
 * Sprint 1 - Authentication System
 */

import axios from 'axios';
import type {
  LoginCredentials,
  RegisterData,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create a separate axios instance for auth (no interceptors to avoid circular dependencies)
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await authApi.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<RegisterResponse> {
  const response = await authApi.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

/**
 * Get current user info
 */
export async function getMe(accessToken: string): Promise<User> {
  const response = await authApi.get<{ user: User }>('/auth/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.user;
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await authApi.post<RefreshTokenResponse>('/auth/refresh', {
    refreshToken,
  });
  return response.data;
}

/**
 * Logout (optional - just clears server-side session if any)
 */
export async function logout(accessToken: string): Promise<void> {
  try {
    await authApi.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  } catch (error) {
    // Logout can fail silently - we clear local tokens anyway
    console.warn('Logout API call failed:', error);
  }
}
