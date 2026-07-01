import { Alert } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import { isNetworkError } from './apiError';

/**
 * onError estándar para creates NO idempotentes.
 *
 * Con Railway/OkHttp la respuesta (201) a veces no llega al cliente (ERR_NETWORK)
 * aunque el server SÍ procesó el registro. Como no reintentamos las mutaciones
 * (evita duplicados), tratamos el error de red como "probablemente guardado":
 * refrescamos las listas, cerramos el modal y avisamos para que el usuario verifique
 * antes de volver a cargarlo. Los errores con respuesta (validación, conflicto, etc.)
 * muestran su mensaje normal.
 */
export function makeCreateErrorHandler(params: {
  queryClient: QueryClient;
  invalidateKeys: readonly (readonly unknown[])[];
  onClose: () => void;
  fallbackMessage: string;
  savedMessage: string;
}) {
  return (err: unknown) => {
    if (isNetworkError(err)) {
      params.invalidateKeys.forEach((queryKey) =>
        params.queryClient.invalidateQueries({ queryKey })
      );
      params.onClose();
      Alert.alert('Revisá la lista', params.savedMessage);
      return;
    }
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      params.fallbackMessage;
    Alert.alert('Error', msg);
  };
}
