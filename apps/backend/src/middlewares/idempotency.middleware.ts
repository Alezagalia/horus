import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

/**
 * Idempotencia para POSTs. Si el request trae `Idempotency-Key`, guarda la respuesta
 * (2xx) asociada a esa clave; si llega otro POST con la misma clave, devuelve la
 * respuesta cacheada sin re-ejecutar. Sirve para cuando la respuesta original se
 * perdió por red (ERR_NETWORK) y el cliente reintenta con la misma clave: no duplica.
 *
 * Va montado global, antes de las rutas. Si algo falla (p. ej. tabla no migrada aún)
 * degrada a no-op (no bloquea el request).
 */
export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.header('Idempotency-Key');
    // Sólo actúa si el request trae Idempotency-Key. Cubre POST (creates) y PUT
    // (pagos, undo, updates) — operaciones donde perder la respuesta por red y
    // reintentar podría re-ejecutar.
    if (!key || (req.method !== 'POST' && req.method !== 'PUT')) {
      next();
      return;
    }

    const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
    if (existing) {
      res.status(existing.statusCode).json(existing.response as object);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // fire-and-forget; la PK única absorbe carreras con requests concurrentes.
        prisma.idempotencyKey
          .create({
            data: { key, statusCode: res.statusCode, response: (body ?? {}) as object },
          })
          .catch(() => undefined);
      }
      return originalJson(body);
    }) as typeof res.json;

    next();
  } catch {
    next();
  }
}
