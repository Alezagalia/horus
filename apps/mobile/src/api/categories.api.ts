/**
 * Categories API Service
 * Sprint 2 - US-015
 *
 * API client for category endpoints using axios
 */

import axios from 'axios';
import type {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryFilters,
} from '@horus/shared';

// API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// TODO: Add auth interceptor when authentication is implemented
// apiClient.interceptors.request.use((config) => {
//   const token = await getStoredToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

/**
 * Get all categories with optional scope filter
 */
export const getCategories = async (filters?: CategoryFilters): Promise<Category[]> => {
  const params = new URLSearchParams();
  if (filters?.scope) params.append('scope', filters.scope);

  const response = await apiClient.get<Category[]>(`/categories?${params.toString()}`);
  return response.data;
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await apiClient.get<Category>(`/categories/${id}`);
  return response.data;
};

/**
 * Create new category
 */
export const createCategory = async (data: CreateCategoryDTO): Promise<Category> => {
  const response = await apiClient.post<Category>('/categories', data);
  return response.data;
};

/**
 * Update category
 */
export const updateCategory = async (id: string, data: UpdateCategoryDTO): Promise<Category> => {
  const response = await apiClient.put<Category>(`/categories/${id}`, data);
  return response.data;
};

/**
 * Delete category (soft delete)
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};

/**
 * Set category as default for its scope
 */
export const setDefaultCategory = async (id: string): Promise<Category> => {
  const response = await apiClient.put<Category>(`/categories/${id}/set-default`);
  return response.data;
};
