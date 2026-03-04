/**
 * Secure Storage Wrapper
 * Sprint 1 - Authentication System
 *
 * Provides secure token storage using expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Save authentication tokens securely
 */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw new Error('Failed to save authentication tokens');
  }
}

/**
 * Get stored authentication tokens
 */
export async function getTokens(): Promise<StoredTokens | null> {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting tokens:', error);
    return null;
  }
}

/**
 * Get only access token (for faster checks)
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Save user data
 */
export async function saveUser(user: StoredUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw new Error('Failed to save user data');
  }
}

/**
 * Get stored user data
 */
export async function getUser(): Promise<StoredUser | null> {
  try {
    const userString = await SecureStore.getItemAsync(USER_KEY);
    if (!userString) {
      return null;
    }
    return JSON.parse(userString) as StoredUser;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Clear all stored authentication data
 */
export async function clearAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw new Error('Failed to clear authentication data');
  }
}
