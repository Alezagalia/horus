import { axiosInstance } from '@/lib/axios';
import type {
  Resource,
  CreateResourceDto,
  UpdateResourceDto,
  ResourceFilters,
} from '@horus/shared';

export const resourceApi = {
  /**
   * Obtener todos los resources con filtros
   */
  async getAll(filters?: ResourceFilters): Promise<Resource[]> {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.isPinned !== undefined) params.append('isPinned', String(filters.isPinned));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags) filters.tags.forEach((tag) => params.append('tags', tag));

    const response = await axiosInstance.get(`/resources?${params}`);
    return response.data;
  },

  /**
   * Obtener un resource por ID
   */
  async getById(id: string): Promise<Resource> {
    const response = await axiosInstance.get(`/resources/${id}`);
    return response.data;
  },

  /**
   * Crear un nuevo resource
   */
  async create(data: CreateResourceDto): Promise<Resource> {
    const response = await axiosInstance.post('/resources', data);
    return response.data;
  },

  /**
   * Actualizar un resource
   */
  async update(id: string, data: UpdateResourceDto): Promise<Resource> {
    const response = await axiosInstance.put(`/resources/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar un resource
   */
  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/resources/${id}`);
  },

  /**
   * Toggle pin
   */
  async togglePin(id: string): Promise<Resource> {
    const response = await axiosInstance.patch(`/resources/${id}/pin`);
    return response.data;
  },

  /**
   * Búsqueda
   */
  async search(query: string, limit?: number): Promise<Resource[]> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', String(limit));

    const response = await axiosInstance.get(`/resources/search?${params}`);
    return response.data;
  },

  /**
   * Obtener tags
   */
  async getTags(): Promise<string[]> {
    const response = await axiosInstance.get('/resources/tags');
    return response.data;
  },

  /**
   * Obtener estadísticas
   */
  async getStats(): Promise<any> {
    const response = await axiosInstance.get('/resources/stats');
    return response.data;
  },
};
