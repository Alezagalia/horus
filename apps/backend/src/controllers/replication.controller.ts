import { Request, Response, NextFunction } from 'express';
import { replicationService } from '../services/replication/index.js';
import { UnauthorizedError, BadRequestError } from '../middlewares/error.middleware.js';
import { pushEnvelopeSchema } from '../validations/replication.validation.js';
import type { PushChanges } from '../services/replication/types.js';

export const replicationController = {
  async pull(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');
      const lastPulledAt = Number(req.query.lastPulledAt ?? 0) || 0;
      const result = await replicationService.pull(user.id, lastPulledAt);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async push(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError('User not found');
      const parsed = pushEnvelopeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Push de replicación con formato inválido');
      }
      // El schema valida el envelope (shape + ids); los campos raw los validan
      // los handlers de tabla, por eso el cast es seguro acá.
      await replicationService.push(
        user.id,
        parsed.data.changes as PushChanges,
        parsed.data.lastPulledAt ?? 0
      );
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
};
