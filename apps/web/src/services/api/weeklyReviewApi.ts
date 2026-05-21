/**
 * Weekly Review API Service (F-03)
 */

import { axiosInstance } from '@/lib/axios';
import type {
  WeeklyStatsResponse,
  WeeklyReviewResponse,
  WeeklyReviewsResponse,
  ReviewQuestionsResponse,
  ReviewQuestionResponse,
  CreateWeeklyReviewDTO,
  UpdateWeeklyReviewDTO,
  CreateQuestionDTO,
  UpdateQuestionDTO,
  WeeklyStats,
  WeeklyReview,
  ReviewQuestion,
} from '@horus/shared';
export type { UpdateWeeklyReviewDTO };

export async function getWeekStats(weekStart: string): Promise<WeeklyStats> {
  const response = await axiosInstance.get<WeeklyStatsResponse>('/weekly-reviews/stats', {
    params: { weekStart },
  });
  return response.data.stats;
}

export async function getCurrentReview(weekStart: string): Promise<WeeklyReview> {
  const response = await axiosInstance.get<WeeklyReviewResponse>('/weekly-reviews/current', {
    params: { weekStart },
  });
  return response.data.review;
}

export async function listReviews(limit?: number): Promise<WeeklyReview[]> {
  const response = await axiosInstance.get<WeeklyReviewsResponse>('/weekly-reviews', {
    params: limit ? { limit } : undefined,
  });
  return response.data.reviews;
}

export async function createReview(data: CreateWeeklyReviewDTO): Promise<WeeklyReview> {
  const response = await axiosInstance.post<WeeklyReviewResponse>('/weekly-reviews', data);
  return response.data.review;
}

export async function updateReview(id: string, data: UpdateWeeklyReviewDTO): Promise<WeeklyReview> {
  const response = await axiosInstance.put<WeeklyReviewResponse>(`/weekly-reviews/${id}`, data);
  return response.data.review;
}

export async function listQuestions(): Promise<ReviewQuestion[]> {
  const response = await axiosInstance.get<ReviewQuestionsResponse>('/weekly-reviews/questions');
  return response.data.questions;
}

export async function createQuestion(data: CreateQuestionDTO): Promise<ReviewQuestion> {
  const response = await axiosInstance.post<ReviewQuestionResponse>(
    '/weekly-reviews/questions',
    data
  );
  return response.data.question;
}

export async function updateQuestion(id: string, data: UpdateQuestionDTO): Promise<ReviewQuestion> {
  const response = await axiosInstance.put<ReviewQuestionResponse>(
    `/weekly-reviews/questions/${id}`,
    data
  );
  return response.data.question;
}

export async function deleteQuestion(id: string): Promise<void> {
  await axiosInstance.delete(`/weekly-reviews/questions/${id}`);
}
