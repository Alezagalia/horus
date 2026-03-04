/**
 * Authentication Context
 * Sprint 1 - Authentication System
 *
 * Global authentication state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types/auth.types';
import * as authApi from '../api/auth.api';
import * as storage from '../lib/secureStorage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is authenticated on app startup
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Try to get stored tokens
      const tokens = await storage.getTokens();
      if (!tokens) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Verify token by fetching user data
      const userData = await authApi.getMe(tokens.accessToken);
      setUser(userData);

      // Also save user to storage for offline access
      await storage.saveUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      await storage.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      const response = await authApi.login(credentials);

      // Save tokens
      await storage.saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Save user
      await storage.saveUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
      });

      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);

      const response = await authApi.register(data);

      // Save tokens
      await storage.saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      // Save user
      await storage.saveUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
      });

      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get current token for logout API call
      const tokens = await storage.getTokens();
      if (tokens?.accessToken) {
        await authApi.logout(tokens.accessToken);
      }

      // Clear all stored data
      await storage.clearAuth();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Always clear local data even if API call fails
      await storage.clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
