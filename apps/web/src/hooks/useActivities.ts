import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getActivities,
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  toggleActivityRecord,
} from '@/services/api/activityApi';
import type { CreateActivityDTO, UpdateActivityDTO, ToggleActivityRecordDTO } from '@horus/shared';

// ==================== Query Keys ====================

export const activityKeys = {
  all: ['activities'] as const,
  today: (date?: string) => [...activityKeys.all, 'today', date ?? 'today'] as const,
  list: () => [...activityKeys.all, 'list'] as const,
  detail: (id: string) => [...activityKeys.all, 'detail', id] as const,
};

// ==================== Queries ====================

export function useActivities(date?: string) {
  return useQuery({
    queryKey: activityKeys.today(date),
    queryFn: () => getActivities(date),
    staleTime: 1000 * 30,
  });
}

export function useAllActivities() {
  return useQuery({
    queryKey: activityKeys.list(),
    queryFn: getAllActivities,
    staleTime: 1000 * 60,
  });
}

// ==================== Mutations ====================

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityDTO) => createActivity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Actividad creada');
    },
    onError: () => toast.error('Error al crear actividad'),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityDTO }) => updateActivity(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Actividad actualizada');
    },
    onError: () => toast.error('Error al actualizar actividad'),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Actividad eliminada');
    },
    onError: () => toast.error('Error al eliminar actividad'),
  });
}

export function useToggleActivityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: string; data: ToggleActivityRecordDTO }) =>
      toggleActivityRecord(activityId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
    },
    onError: () => toast.error('Error al actualizar registro'),
  });
}
