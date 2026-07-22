import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      // NO reintentar mutaciones. Un "error de red" en un POST NO significa que el
      // server no lo procesó: con Railway/OkHttp la respuesta 201 a veces no llega
      // al cliente (ERR_NETWORK) aunque el registro se haya creado. Reintentar en
      // ese caso duplicaba los creates no idempotentes (transacciones, etc.). El
      // cold-start se cubre con el timeout alto de axios (60s), no reintentando.
      retry: false,
    },
  },
});

export const QUERY_CACHE_STORAGE_KEY = 'horus-query-cache';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_STORAGE_KEY,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
