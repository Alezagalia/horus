/**
 * Category API Service
 * Sprint 11 - US-102
 */

import { axiosInstance } from '@/lib/axios';
import type { Category, Scope, CreateCategoryDTO, UpdateCategoryDTO } from '@horus/shared';

export interface GetCategoriesFilters {
  scope?: Scope | string;
}

/**
 * GET /api/categories
 * Obtiene todas las categorías del usuario con filtros opcionales
 */
export async function getCategories(filters?: GetCategoriesFilters): Promise<Category[]> {
  const params: Record<string, string> = {};
  if (filters?.scope) {
    params.scope = filters.scope;
  }

  const response = await axiosInstance.get<{ categories: Category[] }>('/categories', { params });
  return response.data.categories;
}

/**
 * GET /api/categories/:id
 * Obtiene una categoría por ID
 */
export async function getCategoryById(id: string): Promise<Category> {
  const response = await axiosInstance.get<{ category: Category }>(`/categories/${id}`);
  return response.data.category;
}

/**
 * POST /api/categories
 * Crea una nueva categoría
 */
export async function createCategory(data: CreateCategoryDTO): Promise<Category> {
  const response = await axiosInstance.post<{ category: Category }>('/categories', data);
  return response.data.category;
}

/**
 * PUT /api/categories/:id
 * Actualiza una categoría existente
 */
export async function updateCategory(id: string, data: UpdateCategoryDTO): Promise<Category> {
  const response = await axiosInstance.put<{ category: Category }>(`/categories/${id}`, data);
  return response.data.category;
}

/**
 * DELETE /api/categories/:id
 * Elimina una categoría (soft o hard delete según tenga items asociados)
 */
export async function deleteCategory(id: string): Promise<void> {
  await axiosInstance.delete(`/categories/${id}`);
}

/**
 * PUT /api/categories/:id/set-default
 * Marca una categoría como default para su scope
 */
export async function setDefaultCategory(id: string): Promise<Category> {
  const response = await axiosInstance.put<{ category: Category }>(`/categories/${id}/set-default`);
  return response.data.category;
}
