/**
 * Weekly Review API - Mobile (F-03)
 */

import { apiClient } from '../lib/axios';

export interface ReviewQuestion {
  id: string;
  userId: string;
  text: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  habits: { completed: number; total: number; rate: number };
  tasks: { completed: number };
  finance: { income: number; expenses: number; balance: number };
  goals: Array<{ id: string; title: string; progress: number }>;
  events: { completed: number; total: number };
}

export interface WeeklyReviewAnswer {
  questionId: string;
  question?: { id: string; text: string; order: number };
  answer: string;
}

export interface WeeklyReviewFocusGoal {
  goalId: string;
  goal: { id: string; title: string; status: string; priority?: string | null };
}

export interface WeeklyReviewFocusTask {
  taskId: string;
  task: { id: string; title: string; status: string; priority?: string | null };
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  statsSnapshot?: WeeklyStats | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  answers: WeeklyReviewAnswer[];
  focusGoals: WeeklyReviewFocusGoal[];
  focusTasks: WeeklyReviewFocusTask[];
}

export interface UpdateReviewInput {
  answers?: { questionId: string; answer: string }[];
  focusGoalIds?: string[];
  focusTaskIds?: string[];
  completedAt?: string | null;
}

// ─── API functions ─────────────────────────────────────────────────────────────

export const getWeekStats = async (weekStart: string): Promise<WeeklyStats> => {
  const response = await apiClient.get<{ stats: WeeklyStats }>('/weekly-reviews/stats', {
    params: { weekStart },
  });
  return response.data.stats;
};

export const getCurrentReview = async (weekStart: string): Promise<WeeklyReview> => {
  const response = await apiClient.get<{ review: WeeklyReview }>('/weekly-reviews/current', {
    params: { weekStart },
  });
  return response.data.review;
};

export const listReviews = async (): Promise<WeeklyReview[]> => {
  const response = await apiClient.get<{ reviews: WeeklyReview[] }>('/weekly-reviews');
  return response.data.reviews;
};

export const updateReview = async (id: string, data: UpdateReviewInput): Promise<WeeklyReview> => {
  const response = await apiClient.put<{ review: WeeklyReview }>(`/weekly-reviews/${id}`, data);
  return response.data.review;
};

export const listQuestions = async (): Promise<ReviewQuestion[]> => {
  const response = await apiClient.get<{ questions: ReviewQuestion[] }>(
    '/weekly-reviews/questions'
  );
  return response.data.questions;
};

export const createQuestion = async (text: string, order?: number): Promise<ReviewQuestion> => {
  const response = await apiClient.post<{ question: ReviewQuestion }>('/weekly-reviews/questions', {
    text,
    order,
  });
  return response.data.question;
};
