import { useQuery } from '@tanstack/react-query';
import { habitMomentApi, type HabitMoment } from '@/services/api/habitMomentApi';

export { type HabitMoment };

export const momentKeys = {
  all: ['habitMoments'] as const,
};

/** Momentos del día configurados por el usuario. Cache de 30 min. */
export function useHabitMoments() {
  return useQuery({
    queryKey: momentKeys.all,
    queryFn: habitMomentApi.list,
    staleTime: 1000 * 60 * 30,
  });
}
