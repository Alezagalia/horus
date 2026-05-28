import { axiosInstance } from '../axios';
import type {
  WeeklyStats,
  WeeklyReview,
  CreateWeeklyReviewDTO,
  UpdateWeeklyReviewDTO,
  ReviewQuestion,
} from '@horus/shared';

export const weeklyReviewApi = {
  getStats: async (weekStart: string): Promise<WeeklyStats> => {
    const { data } = await axiosInstance.get('/weekly-reviews/stats', { params: { weekStart } });
    return data.stats;
  },

  getCurrent: async (weekStart: string): Promise<WeeklyReview | null> => {
    const { data } = await axiosInstance.get('/weekly-reviews/current', { params: { weekStart } });
    return data.review ?? null;
  },

  getHistory: async (limit = 8): Promise<WeeklyReview[]> => {
    const { data } = await axiosInstance.get('/weekly-reviews', { params: { limit } });
    return data.reviews ?? [];
  },

  create: async (dto: CreateWeeklyReviewDTO): Promise<WeeklyReview> => {
    const { data } = await axiosInstance.post('/weekly-reviews', dto);
    return data.review;
  },

  update: async (id: string, dto: UpdateWeeklyReviewDTO): Promise<WeeklyReview> => {
    const { data } = await axiosInstance.put(`/weekly-reviews/${id}`, dto);
    return data.review;
  },

  getQuestions: async (): Promise<ReviewQuestion[]> => {
    const { data } = await axiosInstance.get('/weekly-reviews/questions');
    return data.questions ?? [];
  },
};
