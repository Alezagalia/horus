import { axiosInstance } from '../axios';
import type {
  Exercise,
  ExerciseWithStats,
  ExercisesResponse,
  CreateExerciseDTO,
  UpdateExerciseDTO,
  ExerciseFilters,
  MuscleGroup,
} from '@horus/shared';

export type { Exercise, ExerciseWithStats, MuscleGroup };

export const exerciseApi = {
  list: async (filters?: ExerciseFilters): Promise<ExercisesResponse> => {
    const { data } = await axiosInstance.get('/exercises', { params: filters });
    return data;
  },

  create: async (dto: CreateExerciseDTO): Promise<Exercise> => {
    const { data } = await axiosInstance.post('/exercises', dto);
    return data.exercise ?? data;
  },

  update: async (id: string, dto: UpdateExerciseDTO): Promise<Exercise> => {
    const { data } = await axiosInstance.put(`/exercises/${id}`, dto);
    return data.exercise ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/exercises/${id}`);
  },
};
