/**
 * Resources API Client
 * Fase 3 - Mobile Implementation
 */

import axios from 'axios';
import type {
  Resource,
  CreateResourceDto,
  UpdateResourceDto,
  ResourceFilters,
  ResourceStats,
} from '@horus/shared';

const API_URL = 'http://localhost:3001/api/v1';

// TODO: Get token from secure storage (AsyncStorage/SecureStore)
const getAuthToken = () => {
  return 'dummy-token-for-development';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const resourcesApi = {
  /**
   * Get all resources with optional filters
   */
  async getAll(filters?: ResourceFilters): Promise<Resource[]> {
    const params: Record<string, string> = {};

    if (filters?.type) params.type = filters.type;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.isPinned !== undefined) params.isPinned = String(filters.isPinned);
    if (filters?.tags?.length) params.tags = filters.tags.join(',');

    const { data } = await api.get<Resource[]>('/resources', { params });
    return data;
  },

  /**
   * Get a single resource by ID
   */
  async getById(id: string): Promise<Resource> {
    const { data } = await api.get<Resource>(`/resources/${id}`);
    return data;
  },

  /**
   * Create a new resource
   */
  async create(resourceData: CreateResourceDto): Promise<Resource> {
    const { data } = await api.post<Resource>('/resources', resourceData);
    return data;
  },

  /**
   * Update an existing resource
   */
  async update(id: string, resourceData: UpdateResourceDto): Promise<Resource> {
    const { data } = await api.put<Resource>(`/resources/${id}`, resourceData);
    return data;
  },

  /**
   * Delete a resource
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/resources/${id}`);
  },

  /**
   * Toggle pin status
   */
  async togglePin(id: string): Promise<Resource> {
    const { data } = await api.patch<Resource>(`/resources/${id}/toggle-pin`);
    return data;
  },

  /**
   * Search resources
   */
  async search(query: string): Promise<Resource[]> {
    const { data } = await api.get<Resource[]>('/resources/search', {
      params: { q: query },
    });
    return data;
  },

  /**
   * Get all tags used across resources
   */
  async getTags(): Promise<string[]> {
    const { data } = await api.get<string[]>('/resources/tags');
    return data;
  },

  /**
   * Get resource statistics
   */
  async getStats(): Promise<ResourceStats> {
    const { data } = await api.get<ResourceStats>('/resources/stats');
    return data;
  },
};
