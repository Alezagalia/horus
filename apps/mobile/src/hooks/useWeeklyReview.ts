import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weeklyReviewApi } from '@/services/api/weeklyReviewApi';
import type { UpdateWeeklyReviewDTO, CreateWeeklyReviewDTO } from '@horus/shared';

export const reviewKeys = {
  all: ['weekly-reviews'] as const,
  stats: (weekStart: string) => [...reviewKeys.all, 'stats', weekStart] as const,
  current: (weekStart: string) => [...reviewKeys.all, 'current', weekStart] as const,
  history: () => [...reviewKeys.all, 'history'] as const,
  questions: () => [...reviewKeys.all, 'questions'] as const,
};

export function useWeeklyStats(weekStart: string) {
  return useQuery({
    queryKey: reviewKeys.stats(weekStart),
    queryFn: () => weeklyReviewApi.getStats(weekStart),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCurrentReview(weekStart: string) {
  return useQuery({
    queryKey: reviewKeys.current(weekStart),
    queryFn: () => weeklyReviewApi.getCurrent(weekStart),
    staleTime: 1000 * 60 * 2,
  });
}

export function useReviewHistory() {
  return useQuery({
    queryKey: reviewKeys.history(),
    queryFn: () => weeklyReviewApi.getHistory(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useReviewQuestions() {
  return useQuery({
    queryKey: reviewKeys.questions(),
    queryFn: () => weeklyReviewApi.getQuestions(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWeeklyReviewDTO) => weeklyReviewApi.create(dto),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: reviewKeys.current(review.weekStart) });
      qc.invalidateQueries({ queryKey: reviewKeys.history() });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWeeklyReviewDTO; weekStart: string }) =>
      weeklyReviewApi.update(id, dto),
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: reviewKeys.current(review.weekStart) });
      qc.invalidateQueries({ queryKey: reviewKeys.history() });
    },
  });
}
