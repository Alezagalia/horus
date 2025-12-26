import { z } from 'zod';
import { ResourceType } from '../types/resource.types.js';

export const createResourceSchema = z
  .object({
    type: z.nativeEnum(ResourceType),
    title: z.string().min(1, 'El título es requerido').max(300),
    description: z.string().max(1000).optional(),
    content: z.string().optional(),
    url: z.string().url('URL inválida').optional(),
    language: z.string().max(50).optional(),
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string()).default([]),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').optional(),
  })
  .refine(
    (data) => {
      // NOTE y SNIPPET requieren content
      if (data.type === ResourceType.NOTE || data.type === ResourceType.SNIPPET) {
        return !!data.content && data.content.trim().length > 0;
      }
      return true;
    },
    {
      message: 'El contenido es requerido para notas y snippets',
      path: ['content'],
    }
  )
  .refine(
    (data) => {
      // BOOKMARK requiere url
      if (data.type === ResourceType.BOOKMARK) {
        return !!data.url;
      }
      return true;
    },
    {
      message: 'La URL es requerida para bookmarks',
      path: ['url'],
    }
  )
  .refine(
    (data) => {
      // SNIPPET requiere language
      if (data.type === ResourceType.SNIPPET) {
        return !!data.language;
      }
      return true;
    },
    {
      message: 'El lenguaje es requerido para snippets',
      path: ['language'],
    }
  );

export const updateResourceSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  content: z.string().optional(),
  url: z.string().url().optional(),
  language: z.string().max(50).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
});

export const resourceFiltersSchema = z.object({
  type: z.nativeEnum(ResourceType).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  search: z.string().optional(),
});
