import { Resource, ResourceType, Scope } from '../../../generated/prisma/client.js';
import { logger } from '../../../lib/logger.js';
import { PushContext, logIfConflict } from '../push-context.js';
import { recordTombstones } from '../tombstone.service.js';
import { ResourceRaw } from '../types.js';

/**
 * Recursos (knowledge base): NOTE/SNIPPET/BOOKMARK. Hard delete con tombstones.
 * `tags` (String[] en Prisma) y `metadata` (Json) viajan como JSON string en el
 * raw — WatermelonDB no tiene tipos array/json. La UI mobile no usa categoryId
 * ni metadata pero se replican igual para no perderlos en el round-trip de
 * recursos creados en la web.
 */

const RESOURCE_TYPES = new Set<string>(Object.values(ResourceType));

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function parseMetadata(raw: string | null): object | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function toRaw(r: Resource): ResourceRaw {
  return {
    id: r.id,
    category_id: r.categoryId,
    type: r.type,
    title: r.title,
    description: r.description,
    content: r.content,
    url: r.url,
    language: r.language,
    metadata: r.metadata != null ? JSON.stringify(r.metadata) : null,
    tags: JSON.stringify(r.tags ?? []),
    is_pinned: r.isPinned,
    color: r.color,
    created_at: r.createdAt.getTime(),
    updated_at: r.updatedAt.getTime(),
  };
}

/** categoryId es opcional: si viene pero es ajena/inexistente o de otro scope,
 * se guarda null en vez de descartar el recurso entero. */
async function safeCategoryId(ctx: PushContext, categoryId: string | null): Promise<string | null> {
  if (!categoryId) return null;
  const category = await ctx.tx.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== ctx.userId || category.scope !== Scope.knowledge) {
    logger.warn(
      `[replication] resource con categoría ajena/inexistente/de otro scope ${categoryId}: se anula`
    );
    return null;
  }
  return categoryId;
}

export async function applyCreated(ctx: PushContext, raws: ResourceRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.resource.findUnique({ where: { id: raw.id } });
    if (existing) continue; // retry de push: no re-crear

    if (!RESOURCE_TYPES.has(raw.type)) {
      logger.warn(`[replication] resource ${raw.id} con type inválido "${raw.type}": ignorado`);
      continue;
    }

    // Tombstone gana (hard delete)
    const tombstone = await ctx.tx.replicationTombstone.findUnique({
      where: { tableName_rowId: { tableName: 'resources', rowId: raw.id } },
    });
    if (tombstone) {
      logger.warn(`[replication] resource ${raw.id} con tombstone previo: create ignorado`);
      continue;
    }

    await ctx.tx.resource.create({
      data: {
        id: raw.id,
        userId: ctx.userId,
        categoryId: await safeCategoryId(ctx, raw.category_id),
        type: raw.type as ResourceType,
        title: raw.title,
        description: raw.description,
        content: raw.content,
        url: raw.url,
        language: raw.language,
        metadata: parseMetadata(raw.metadata),
        tags: parseTags(raw.tags),
        isPinned: raw.is_pinned ?? false,
        color: raw.color,
      },
    });
  }
}

export async function applyUpdated(ctx: PushContext, raws: ResourceRaw[]): Promise<void> {
  for (const raw of raws) {
    const existing = await ctx.tx.resource.findUnique({ where: { id: raw.id } });
    if (!existing) {
      await applyCreated(ctx, [raw]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;
    if (!RESOURCE_TYPES.has(raw.type)) {
      logger.warn(`[replication] update de resource ${raw.id} con type inválido: ignorado`);
      continue;
    }
    logIfConflict(ctx, 'resources', raw.id, existing.updatedAt);

    await ctx.tx.resource.update({
      where: { id: raw.id },
      data: {
        categoryId: await safeCategoryId(ctx, raw.category_id),
        type: raw.type as ResourceType,
        title: raw.title,
        description: raw.description,
        content: raw.content,
        url: raw.url,
        language: raw.language,
        metadata: parseMetadata(raw.metadata),
        tags: parseTags(raw.tags),
        isPinned: raw.is_pinned,
        color: raw.color,
      },
    });
  }
}

/** Hard delete con tombstones. */
export async function applyDeleted(ctx: PushContext, ids: string[]): Promise<void> {
  for (const id of ids) {
    const existing = await ctx.tx.resource.findUnique({ where: { id } });
    if (!existing) {
      await recordTombstones(ctx.tx, ctx.userId, 'resources', [id]);
      continue;
    }
    if (existing.userId !== ctx.userId) continue;

    await recordTombstones(ctx.tx, ctx.userId, 'resources', [id]);
    await ctx.tx.resource.delete({ where: { id } });
  }
}
