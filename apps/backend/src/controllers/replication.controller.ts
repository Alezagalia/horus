import { Request, Response, NextFunction } from 'express';
import { replicationService } from '../services/replication.service.js';
import { UnauthorizedError } from '../middlewares/error.middleware.js';

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
      await replicationService.push(user.id, req.body?.changes ?? {});
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
};
