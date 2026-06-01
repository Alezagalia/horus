import { axiosInstance } from '@/lib/axios';
import type {
  Activity,
  ActivityRecord,
  CreateActivityDTO,
  UpdateActivityDTO,
  ToggleActivityRecordDTO,
} from '@horus/shared';

export async function getActivities(date?: string): Promise<Activity[]> {
  const params = date ? { date } : {};
  const { data } = await axiosInstance.get('/activities', { params });
  return data.activities;
}

export async function getAllActivities(): Promise<Activity[]> {
  const { data } = await axiosInstance.get('/activities/all');
  return data.activities;
}

export async function getActivityById(id: string): Promise<Activity> {
  const { data } = await axiosInstance.get(`/activities/${id}`);
  return data.activity;
}

export async function createActivity(payload: CreateActivityDTO): Promise<Activity> {
  const { data } = await axiosInstance.post('/activities', payload);
  return data.activity;
}

export async function updateActivity(id: string, payload: UpdateActivityDTO): Promise<Activity> {
  const { data } = await axiosInstance.put(`/activities/${id}`, payload);
  return data.activity;
}

export async function deleteActivity(id: string): Promise<void> {
  await axiosInstance.delete(`/activities/${id}`);
}

export async function toggleActivityRecord(
  activityId: string,
  payload: ToggleActivityRecordDTO
): Promise<ActivityRecord> {
  const { data } = await axiosInstance.post(`/activities/${activityId}/records`, payload);
  return data.record;
}
