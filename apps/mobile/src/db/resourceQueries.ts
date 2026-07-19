import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Resource as ResourceModel } from './models/Resource';
import type { Resource, ResourceType } from '@/services/api/resourceApi';

/**
 * Lecturas locales del dominio Recursos (offline-first Fase 3). Espeja el
 * listado REST: filtros por tipo/pin en SQLite y búsqueda por texto en JS
 * (título, descripción, contenido y tags — pocas filas, sin FTS).
 */

const resources = () => database.get<ResourceModel>('resources');

function toResource(r: ResourceModel): Resource {
  return {
    id: r.id,
    type: r.type as ResourceType,
    title: r.title,
    description: r.description ?? undefined,
    content: r.content ?? undefined,
    url: r.url ?? undefined,
    language: r.language ?? undefined,
    tags: r.tagsArray,
    isPinned: r.isPinned,
    color: r.color ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listResourcesLocal(filters?: {
  type?: ResourceType;
  search?: string;
  isPinned?: boolean;
}): Promise<Resource[]> {
  const clauses = [];
  if (filters?.type) clauses.push(Q.where('type', filters.type));
  if (filters?.isPinned !== undefined) clauses.push(Q.where('is_pinned', filters.isPinned));

  const rows = await resources()
    .query(...clauses)
    .fetch();
  let items = rows.map(toResource);

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    items = items.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        (r.description ?? '').toLowerCase().includes(term) ||
        (r.content ?? '').toLowerCase().includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  // Pineados primero, luego más recientes (igual que el listado REST)
  items.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return items;
}
