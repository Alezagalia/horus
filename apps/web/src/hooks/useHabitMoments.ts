import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getHabitMoments,
  createHabitMoment,
  updateHabitMoment,
  deleteHabitMoment,
  type CreateHabitMomentDTO,
  type UpdateHabitMomentDTO,
} from '@/services/api/habitMomentApi';

export const momentKeys = {
  all: ['habitMoments'] as const,
};

export function useHabitMoments() {
  return useQuery({
    queryKey: momentKeys.all,
    queryFn: getHabitMoments,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateHabitMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateHabitMomentDTO) => createHabitMoment(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: momentKeys.all });
      toast.success('Momento creado');
    },
    onError: () => toast.error('No se pudo crear el momento'),
  });
}

export function useUpdateHabitMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateHabitMomentDTO }) =>
      updateHabitMoment(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: momentKeys.all });
      toast.success('Momento actualizado');
    },
    onError: () => toast.error('No se pudo actualizar el momento'),
  });
}

export function useDeleteHabitMoment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHabitMoment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: momentKeys.all });
      toast.success('Momento eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el momento'),
  });
}
