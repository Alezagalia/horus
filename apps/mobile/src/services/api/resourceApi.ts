import { axiosInstance } from '../axios';

export type ResourceType = 'NOTE' | 'SNIPPET' | 'BOOKMARK';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  tags: string[];
  isPinned: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceDTO {
  type: ResourceType;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  tags?: string[];
  color?: string;
}

export interface UpdateResourceDTO {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  tags?: string[];
  isPinned?: boolean;
  color?: string | null;
}

export const resourceApi = {
  list: async (filters?: {
    type?: ResourceType;
    search?: string;
    isPinned?: boolean;
  }): Promise<Resource[]> => {
    const { data } = await axiosInstance.get('/resources', { params: filters });
    return Array.isArray(data) ? data : (data.resources ?? []);
  },

  create: async (dto: CreateResourceDTO): Promise<Resource> => {
    const { data } = await axiosInstance.post('/resources', dto);
    return data;
  },

  update: async (id: string, dto: UpdateResourceDTO): Promise<Resource> => {
    const { data } = await axiosInstance.put(`/resources/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/resources/${id}`);
  },

  togglePin: async (id: string): Promise<Resource> => {
    const { data } = await axiosInstance.patch(`/resources/${id}/pin`);
    return data;
  },
};
