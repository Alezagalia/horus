import type { Request, Response } from 'express';
import { resourceService } from '../services/resource.service.js';
import { resourceSearchService } from '../services/resourceSearch.service.js';
import {
  createResourceSchema,
  updateResourceSchema,
  resourceFiltersSchema,
} from '@horus/shared';

export class ResourceController {
  /**
   * POST /api/resources
   * Crear un nuevo resource
   */
  async create(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = createResourceSchema.parse(req.body);

      const resource = await resourceService.createResource(userId, validatedData);

      res.status(201).json(resource);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(400).json({ error: 'Error al crear resource' });
    }
  }

  /**
   * GET /api/resources
   * Obtener resources del usuario con filtros
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const filters = resourceFiltersSchema.parse(req.query);

      const resources = await resourceService.getResources(userId, filters);

      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(400).json({ error: 'Error al obtener resources' });
    }
  }

  /**
   * GET /api/resources/:id
   * Obtener un resource específico
   */
  async getById(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const resource = await resourceService.getResourceById(userId, id);

      res.json(resource);
    } catch (error) {
      console.error('Error fetching resource:', error);
      res.status(404).json({ error: 'Resource no encontrado' });
    }
  }

  /**
   * PUT /api/resources/:id
   * Actualizar un resource
   */
  async update(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const validatedData = updateResourceSchema.parse(req.body);

      const resource = await resourceService.updateResource(userId, id, validatedData);

      res.json(resource);
    } catch (error) {
      console.error('Error updating resource:', error);
      res.status(400).json({ error: 'Error al actualizar resource' });
    }
  }

  /**
   * DELETE /api/resources/:id
   * Eliminar un resource
   */
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await resourceService.deleteResource(userId, id);

      res.json(result);
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(400).json({ error: 'Error al eliminar resource' });
    }
  }

  /**
   * PATCH /api/resources/:id/pin
   * Toggle pin status
   */
  async togglePin(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const resource = await resourceService.togglePin(userId, id);

      res.json(resource);
    } catch (error) {
      console.error('Error toggling pin:', error);
      res.status(400).json({ error: 'Error al cambiar estado de pin' });
    }
  }

  /**
   * GET /api/resources/search
   * Búsqueda de resources
   */
  async search(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query requerido' });
      }

      const resources = await resourceSearchService.searchResources(
        userId,
        q,
        limit ? parseInt(limit as string) : 20
      );

      res.json(resources);
    } catch (error) {
      console.error('Error searching resources:', error);
      res.status(400).json({ error: 'Error en la búsqueda' });
    }
  }

  /**
   * GET /api/resources/tags
   * Obtener tags únicos del usuario
   */
  async getTags(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const tags = await resourceService.getUserTags(userId);

      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(400).json({ error: 'Error al obtener tags' });
    }
  }

  /**
   * GET /api/resources/stats
   * Obtener estadísticas
   */
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const stats = await resourceSearchService.getStats(userId);

      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(400).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const resourceController = new ResourceController();
