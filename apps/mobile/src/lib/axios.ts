/**
 * Axios Instance with Authentication Interceptors
 * Sprint 1 - Authentication System
 *
 * Based on web implementation: apps/web/src/lib/axios.ts
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, saveTokens, clearAuth } from './secureStorage';
import { refreshToken as refreshTokenApi } from '../api/auth.api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Request Interceptor: Add authentication token to requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Handle 401 errors and refresh token
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const message = retryAfter
        ? `Demasiadas solicitudes. Por favor espera ${Math.ceil(Number(retryAfter) / 60)} minutos.`
        : 'Demasiadas solicitudes. Por favor espera unos minutos.';
      error.message = message;
      return Promise.reject(error);
    }

    // If not 401 or already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Get refresh token from secure storage
      const { getTokens } = await import('./secureStorage');
      const tokens = await getTokens();

      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Attempt to refresh the token
      const response = await refreshTokenApi(tokens.refreshToken);

      // Save new tokens
      await saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Update the failed request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
      }

      processQueue(null, response.accessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);

      // Clear tokens and redirect to login
      await clearAuth();

      // You can emit an event here to force logout in AuthContext
      // For now, just reject
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
