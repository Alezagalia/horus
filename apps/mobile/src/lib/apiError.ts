import { AxiosError } from 'axios';

/**
 * Extrae un mensaje legible del error de la API.
 * El backend responde { error, message, statusCode, details?[] }.
 */
export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  const e = error as AxiosError<{
    message?: string;
    error?: string;
    details?: Array<{ field?: string; message?: string }>;
  }>;
  const data = e?.response?.data;
  if (data?.details?.length) {
    return data.details
      .map((d) => d.message ?? d.field ?? '')
      .filter(Boolean)
      .join('\n');
  }
  // El rate limiter responde { error: "Too many..." } sin `message`.
  return data?.message ?? data?.error ?? e?.message ?? fallback;
}

/**
 * True si el error es de red/timeout (no hubo respuesta del servidor), por lo que
 * tiene sentido reintentar. Los errores con respuesta (4xx/5xx) NO se reintentan.
 */
export function isNetworkError(error: unknown): boolean {
  const e = error as AxiosError;
  return !!e?.isAxiosError && !e.response;
}
