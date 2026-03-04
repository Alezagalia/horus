/**
 * Categories API Service
 * Sprint 2 - US-015
 *
 * API client for category endpoints using axios
 */

// Sprint 1: Use centralized axios instance with auth interceptors
import { apiClient } from '../lib/axios';
import type {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryFilters,
} from '@horus/shared';

/**
 * Get all categories with optional scope filter
 */
export const getCategories = async (filters?: CategoryFilters): Promise<Category[]> => {
  const params = new URLSearchParams();
  if (filters?.scope) params.append('scope', filters.scope);

  const response = await apiClient.get<{ categories: Category[] }>(`/categories?${params.toString()}`);
  return response.data.categories;
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await apiClient.get<{ category: Category }>(`/categories/${id}`);
  return response.data.category;
};

/**
 * Create new category
 */
export const createCategory = async (data: CreateCategoryDTO): Promise<Category> => {
  const response = await apiClient.post<{ category: Category }>('/categories', data);
  return response.data.category;
};

/**
 * Update category
 */
export const updateCategory = async (id: string, data: UpdateCategoryDTO): Promise<Category> => {
  const response = await apiClient.put<{ category: Category }>(`/categories/${id}`, data);
  return response.data.category;
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
  const response = await apiClient.put<{ category: Category }>(`/categories/${id}/set-default`);
  return response.data.category;
};
