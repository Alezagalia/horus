import { axiosInstance } from '../axios';

export interface EventCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export const categoryApi = {
  listByScope: async (scope: string): Promise<EventCategory[]> => {
    const { data } = await axiosInstance.get(`/categories`, { params: { scope } });
    return data.categories ?? data;
  },
};
