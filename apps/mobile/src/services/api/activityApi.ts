import {
  Activity,
  ActivityRecord,
  CreateActivityDTO,
  UpdateActivityDTO,
  ToggleActivityRecordDTO,
} from '@horus/shared';
import { axiosInstance } from '../axios';

export const activityApi = {
  list: async (date?: string): Promise<Activity[]> => {
    const { data } = await axiosInstance.get('/activities', {
      params: date ? { date } : undefined,
    });
    return data.activities ?? data;
  },

  listAll: async (): Promise<Activity[]> => {
    const { data } = await axiosInstance.get('/activities/all');
    return data.activities ?? data;
  },

  create: async (dto: CreateActivityDTO): Promise<Activity> => {
    const { data } = await axiosInstance.post('/activities', dto);
    return data.activity ?? data;
  },

  update: async (id: string, dto: UpdateActivityDTO): Promise<Activity> => {
    const { data } = await axiosInstance.put(`/activities/${id}`, dto);
    return data.activity ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/activities/${id}`);
  },

  toggleRecord: async (id: string, dto: ToggleActivityRecordDTO): Promise<ActivityRecord> => {
    const { data } = await axiosInstance.post(`/activities/${id}/records`, dto);
    return data.record ?? data;
  },
};
