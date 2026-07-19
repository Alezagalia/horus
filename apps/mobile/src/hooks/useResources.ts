import { useMutation } from '@tanstack/react-query';
import { useWatermelonQuery } from './useWatermelonQuery';
import { listResourcesLocal } from '@/db/resourceQueries';
import {
  createResourceLocal,
  updateResourceLocal,
  deleteResourceLocal,
  togglePinResourceLocal,
} from '@/db/resourceWrites';
import type {
  CreateResourceDTO,
  UpdateResourceDTO,
  ResourceType,
} from '@/services/api/resourceApi';

// Offline-first Fase 3: los recursos se leen/escriben en WatermelonDB
// (db/resourceQueries|resourceWrites) y se replican vía /api/replication.
// La reactividad viene de withChangesForTables: no hace falta invalidar
// queries en las mutaciones.

export const resourceKeys = {
  all: ['resources'] as const,
  list: (filters?: object) => [...resourceKeys.all, 'list', filters] as const,
};

export function useResources(filters?: {
  type?: ResourceType;
  search?: string;
  isPinned?: boolean;
}) {
  return useWatermelonQuery(resourceKeys.list(filters), () => listResourcesLocal(filters), [
    'resources',
  ]);
}

export function useCreateResource() {
  return useMutation({
    mutationFn: (dto: CreateResourceDTO) => createResourceLocal(dto),
  });
}

export function useUpdateResource() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateResourceDTO }) =>
      updateResourceLocal(id, dto),
  });
}

export function useDeleteResource() {
  return useMutation({
    mutationFn: (id: string) => deleteResourceLocal(id),
  });
}

export function useTogglePinResource() {
  return useMutation({
    mutationFn: (id: string) => togglePinResourceLocal(id),
  });
}
