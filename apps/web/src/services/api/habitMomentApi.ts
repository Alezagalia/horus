import { axiosInstance } from '@/lib/axios';

export interface HabitMoment {
  id: string;
  userId: string;
  key: string;
  label: string;
  emoji: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitMomentDTO {
  key: string;
  label: string;
  emoji?: string;
  startHour: number;
  startMinute?: number;
  endHour: number;
  endMinute?: number;
  sortOrder?: number;
}

export interface UpdateHabitMomentDTO extends Partial<Omit<CreateHabitMomentDTO, 'key'>> {
  isActive?: boolean;
}

export async function getHabitMoments(): Promise<HabitMoment[]> {
  const { data } = await axiosInstance.get<{ moments: HabitMoment[] }>('/habit-moments');
  return data.moments;
}

export async function createHabitMoment(dto: CreateHabitMomentDTO): Promise<HabitMoment> {
  const { data } = await axiosInstance.post<{ moment: HabitMoment }>('/habit-moments', dto);
  return data.moment;
}

export async function updateHabitMoment(
  id: string,
  dto: UpdateHabitMomentDTO
): Promise<HabitMoment> {
  const { data } = await axiosInstance.put<{ moment: HabitMoment }>(`/habit-moments/${id}`, dto);
  return data.moment;
}

export async function deleteHabitMoment(id: string): Promise<void> {
  await axiosInstance.delete(`/habit-moments/${id}`);
}
