/**
 * Weekly Review Shared Types (F-03)
 * Revisión Semanal / Check-in
 */

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
  goals: Array<{ id: string; title: string; progress: number; status: string }>;
  events: { completed: number; total: number };
}

export interface WeeklyReviewAnswer {
  questionId: string;
  question?: Pick<ReviewQuestion, 'id' | 'text' | 'order'>;
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

export interface CreateWeeklyReviewDTO {
  weekStart: string;
}

export interface UpdateWeeklyReviewDTO {
  answers?: { questionId: string; answer: string }[];
  focusGoalIds?: string[];
  focusTaskIds?: string[];
  completedAt?: string | null;
}

export interface CreateQuestionDTO {
  text: string;
  order?: number;
}

export type UpdateQuestionDTO = Partial<CreateQuestionDTO & { isActive: boolean }>;

// API response shapes
export interface WeeklyStatsResponse {
  message: string;
  stats: WeeklyStats;
}

export interface WeeklyReviewResponse {
  message: string;
  review: WeeklyReview;
}

export interface WeeklyReviewsResponse {
  message: string;
  reviews: WeeklyReview[];
  count: number;
}

export interface ReviewQuestionsResponse {
  message: string;
  questions: ReviewQuestion[];
  count: number;
}

export interface ReviewQuestionResponse {
  message: string;
  question: ReviewQuestion;
}
