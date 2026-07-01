import { axiosInstance } from '../axios';
import { postIdempotent } from '../idempotent';
import type { Category, CreateCategoryDTO, UpdateCategoryDTO, Scope } from '@horus/shared';

export type { Category, Scope };

// Legacy minimal type used by agenda/events pickers — kept for backwards compat
export interface EventCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export const categoryApi = {
  list: async (scope?: Scope): Promise<Category[]> => {
    const { data } = await axiosInstance.get('/categories', {
      params: scope ? { scope } : undefined,
    });
    return data.categories ?? data;
  },

  // Alias used by existing screens
  listByScope: async (scope: string): Promise<EventCategory[]> => {
    const { data } = await axiosInstance.get('/categories', { params: { scope } });
    return data.categories ?? data;
  },

  create: async (dto: CreateCategoryDTO): Promise<Category> => {
    const data = await postIdempotent<any>('/categories', dto);
    return data.category ?? data;
  },

  update: async (id: string, dto: UpdateCategoryDTO): Promise<Category> => {
    const { data } = await axiosInstance.put(`/categories/${id}`, dto);
    return data.category ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  },

  setDefault: async (id: string): Promise<Category> => {
    const { data } = await axiosInstance.put(`/categories/${id}/set-default`);
    return data.category ?? data;
  },
};
