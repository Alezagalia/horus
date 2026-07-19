import { database } from './index';
import { Resource as ResourceModel } from './models/Resource';
import { requestSync } from './syncScheduler';
import type { CreateResourceDTO, UpdateResourceDTO } from '@/services/api/resourceApi';

/**
 * Escrituras locales del dominio Recursos (offline-first Fase 3). El push de
 * replicación las sube al server; delete es hard-delete con tombstone.
 */

const resources = () => database.get<ResourceModel>('resources');

export async function createResourceLocal(dto: CreateResourceDTO): Promise<void> {
  await database.write(async () => {
    await resources().create((r) => {
      r.type = dto.type;
      r.title = dto.title;
      r.description = dto.description;
      r.content = dto.content;
      r.url = dto.url;
      r.language = dto.language;
      r.tags = JSON.stringify(dto.tags ?? []);
      r.isPinned = false;
      r.color = dto.color;
    });
  });
  requestSync();
}

export async function updateResourceLocal(id: string, dto: UpdateResourceDTO): Promise<void> {
  await database.write(async () => {
    const resource = await resources().find(id);
    await resource.update((r) => {
      if (dto.title !== undefined) r.title = dto.title;
      if (dto.description !== undefined) r.description = dto.description;
      if (dto.content !== undefined) r.content = dto.content;
      if (dto.url !== undefined) r.url = dto.url;
      if (dto.language !== undefined) r.language = dto.language;
      if (dto.tags !== undefined) r.tags = JSON.stringify(dto.tags);
      if (dto.isPinned !== undefined) r.isPinned = dto.isPinned;
      if (dto.color !== undefined) r.color = dto.color ?? undefined;
    });
  });
  requestSync();
}

export async function deleteResourceLocal(id: string): Promise<void> {
  await database.write(async () => {
    const resource = await resources().find(id);
    await resource.markAsDeleted(); // viaja como deleted en el push (tombstone)
  });
  requestSync();
}

export async function togglePinResourceLocal(id: string): Promise<void> {
  await database.write(async () => {
    const resource = await resources().find(id);
    await resource.update((r) => {
      r.isPinned = !r.isPinned;
    });
  });
  requestSync();
}
