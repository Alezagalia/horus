import { prisma } from '../lib/prisma.js';
import type {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceFilters,
  ResourceType,
} from '@horus/shared';

export class ResourceService {
  /**
   * Crear un nuevo resource
   */
  async createResource(userId: string, data: CreateResourceDto) {
    // Calcular metadata según el tipo
    const metadata = this.generateMetadata(data);

    const resource = await prisma.resource.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        language: data.language,
        categoryId: data.categoryId,
        tags: data.tags || [],
        color: data.color,
        metadata,
      },
      include: {
        category: true,
      },
    });

    return resource;
  }

  /**
   * Obtener resources del usuario con filtros
   */
  async getResources(userId: string, filters?: ResourceFilters) {
    const where: any = { userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return resources;
  }

  /**
   * Obtener un resource por ID
   */
  async getResourceById(userId: string, resourceId: string) {
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        userId,
      },
      include: {
        category: true,
      },
    });

    if (!resource) {
      throw new Error('Resource no encontrado');
    }

    return resource;
  }

  /**
   * Actualizar un resource
   */
  async updateResource(userId: string, resourceId: string, data: UpdateResourceDto) {
    // Verificar que el resource existe y pertenece al usuario
    await this.getResourceById(userId, resourceId);

    const resource = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        language: data.language,
        categoryId: data.categoryId,
        tags: data.tags,
        isPinned: data.isPinned,
        color: data.color,
      },
      include: {
        category: true,
      },
    });

    return resource;
  }

  /**
   * Eliminar un resource
   */
  async deleteResource(userId: string, resourceId: string) {
    // Verificar que el resource existe y pertenece al usuario
    await this.getResourceById(userId, resourceId);

    await prisma.resource.delete({
      where: { id: resourceId },
    });

    return { message: 'Resource eliminado exitosamente' };
  }

  /**
   * Toggle pin status
   */
  async togglePin(userId: string, resourceId: string) {
    const resource = await this.getResourceById(userId, resourceId);

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: { isPinned: !resource.isPinned },
    });

    return updated;
  }

  /**
   * Obtener tags únicos del usuario
   */
  async getUserTags(userId: string) {
    const resources = await prisma.resource.findMany({
      where: { userId },
      select: { tags: true },
    });

    const allTags = resources.flatMap((r) => r.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  }

  /**
   * Generar metadata según el tipo de resource
   */
  private generateMetadata(data: CreateResourceDto) {
    const metadata: any = {};

    switch (data.type) {
      case 'NOTE':
        if (data.content) {
          metadata.wordCount = data.content.split(/\s+/).length;
        }
        break;

      case 'SNIPPET':
        if (data.content) {
          metadata.lineCount = data.content.split('\n').length;
        }
        break;

      case 'BOOKMARK':
        // Metadata de bookmark se puede extraer después con un servicio externo
        // Por ahora solo guardamos la URL
        break;
    }

    return metadata;
  }
}

export const resourceService = new ResourceService();
