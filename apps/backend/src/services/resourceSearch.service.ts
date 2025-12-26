import { prisma } from '../lib/prisma.js';

export class ResourceSearchService {
  /**
   * Búsqueda avanzada de resources
   */
  async searchResources(userId: string, query: string, limit: number = 20) {
    const resources = await prisma.resource.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      include: {
        category: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    return resources;
  }

  /**
   * Búsqueda por tag
   */
  async searchByTag(userId: string, tag: string) {
    const resources = await prisma.resource.findMany({
      where: {
        userId,
        tags: { has: tag },
      },
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
   * Obtener estadísticas de recursos
   */
  async getStats(userId: string) {
    const [total, byType, pinnedCount] = await Promise.all([
      prisma.resource.count({ where: { userId } }),

      prisma.resource.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),

      prisma.resource.count({ where: { userId, isPinned: true } }),
    ]);

    return {
      total,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      pinned: pinnedCount,
    };
  }
}

export const resourceSearchService = new ResourceSearchService();
