/**
 * Weekly Review React Query Hooks (F-03)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { CreateQuestionDTO, UpdateQuestionDTO, UpdateWeeklyReviewDTO } from '@horus/shared';
import {
  getWeekStats,
  getCurrentReview,
  listReviews,
  updateReview,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/services/api/weeklyReviewApi';

export const reviewKeys = {
  stats: (weekStart: string) => ['weekly-review', 'stats', weekStart] as const,
  current: (weekStart: string) => ['weekly-review', 'current', weekStart] as const,
  history: () => ['weekly-review', 'history'] as const,
  questions: () => ['weekly-review', 'questions'] as const,
};

export function useWeeklyStats(weekStart: string) {
  return useQuery({
    queryKey: reviewKeys.stats(weekStart),
    queryFn: () => getWeekStats(weekStart),
    staleTime: 1000 * 60 * 5,
    enabled: !!weekStart,
  });
}

export function useCurrentReview(weekStart: string) {
  return useQuery({
    queryKey: reviewKeys.current(weekStart),
    queryFn: () => getCurrentReview(weekStart),
    staleTime: 1000 * 60 * 2,
    enabled: !!weekStart,
  });
}

export function useReviewHistory() {
  return useQuery({
    queryKey: reviewKeys.history(),
    queryFn: () => listReviews(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateReview(weekStart: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWeeklyReviewDTO }) =>
      updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.current(weekStart) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.history() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar revisión');
    },
  });
}

export function useReviewQuestions() {
  return useQuery({
    queryKey: reviewKeys.questions(),
    queryFn: listQuestions,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestionDTO) => createQuestion(data),
    onSuccess: () => {
      toast.success('Pregunta creada');
      queryClient.invalidateQueries({ queryKey: reviewKeys.questions() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear pregunta');
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionDTO }) => updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.questions() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar pregunta');
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      toast.success('Pregunta eliminada');
      queryClient.invalidateQueries({ queryKey: reviewKeys.questions() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar pregunta');
    },
  });
}
