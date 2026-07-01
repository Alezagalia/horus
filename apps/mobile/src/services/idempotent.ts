import * as Crypto from 'expo-crypto';
import { axiosInstance } from './axios';
import { isNetworkError } from '@/lib/apiError';

/**
 * POST idempotente. Genera una `Idempotency-Key` (UUID) estable y, ante error de red
 * (ERR_NETWORK / timeout), reintenta con la MISMA clave. El backend deduplica por esa
 * clave, así que el reintento NO duplica y suele traer la respuesta que se había perdido.
 * Con esto los "network error" de los creates se auto-recuperan sin que el usuario los vea.
 */
async function requestIdempotent<T>(
  method: 'post' | 'put',
  url: string,
  data?: unknown,
  maxRetries = 2
): Promise<T> {
  const key = Crypto.randomUUID();
  let attempt = 0;
  for (;;) {
    try {
      const res = await axiosInstance.request<T>({
        method,
        url,
        data,
        headers: { 'Idempotency-Key': key },
      });
      return res.data;
    } catch (err) {
      if (isNetworkError(err) && attempt < maxRetries) {
        attempt += 1;
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
}

export const postIdempotent = <T = unknown>(url: string, data?: unknown, maxRetries?: number) =>
  requestIdempotent<T>('post', url, data, maxRetries);

/** Igual que postIdempotent pero para PUT (pagos, undo, updates idempotentes). */
export const putIdempotent = <T = unknown>(url: string, data?: unknown, maxRetries?: number) =>
  requestIdempotent<T>('put', url, data, maxRetries);
