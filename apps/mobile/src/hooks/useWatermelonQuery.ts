import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { database } from '@/db';

/**
 * Puente WatermelonDB → TanStack Query para el dominio Dinero (offline-first).
 *
 * El loader lee de SQLite local (rápido, sin red) y el resultado se expone con
 * la MISMA interfaz `useQuery` que usaban los hooks REST (data/isLoading/
 * refetch/error), así los consumidores (dinero.tsx, etc.) no cambian.
 * La reactividad viene de `withChangesForTables`: cualquier escritura local o
 * pull del sync invalida la query y se relee de SQLite.
 */
export function useWatermelonQuery<T>(
  queryKey: QueryKey,
  loader: () => Promise<T>,
  tables: string[]
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: loader,
    // Los datos locales nunca están "stale" por tiempo: se invalidan por
    // cambios reales en las tablas. networkMode always: SQLite no necesita red.
    staleTime: Infinity,
    networkMode: 'always',
  });

  const keyHash = JSON.stringify(queryKey);
  const tablesHash = tables.join(',');
  useEffect(() => {
    const subscription = database.withChangesForTables(tables).subscribe({
      next: () => {
        queryClient.invalidateQueries({ queryKey });
      },
      error: () => {},
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyHash, tablesHash, queryClient]);

  return query;
}
