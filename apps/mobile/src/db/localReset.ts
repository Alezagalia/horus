import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '@/db';
import { queryClient, QUERY_CACHE_STORAGE_KEY } from '@/lib/queryClient';

/**
 * Higiene de datos locales entre cuentas. La DB de WatermelonDB y el cache
 * persistido de TanStack Query sobreviven al logout; sin esto, en un
 * dispositivo compartido el siguiente usuario ve los datos del anterior.
 */

const DB_OWNER_KEY = 'horus_db_owner';

/** Borra WMDB + cache de queries (memoria y AsyncStorage). */
export async function resetLocalData(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
  queryClient.clear();
  try {
    await AsyncStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  } catch {
    // best-effort
  }
}

/**
 * Llamar al autenticarse, ANTES de marcar la sesión como activa (con las
 * pantallas de auth montadas nada observa la DB — es el momento seguro para
 * el unsafeResetDatabase). Si la base local pertenece a otro usuario, la
 * resetea; siempre deja registrado al dueño actual.
 */
export async function claimLocalDataForUser(userId: string): Promise<void> {
  try {
    const owner = await AsyncStorage.getItem(DB_OWNER_KEY);
    if (owner && owner !== userId) {
      await resetLocalData();
    }
    await AsyncStorage.setItem(DB_OWNER_KEY, userId);
  } catch (err) {
    console.warn('[localReset] claim failed:', err);
  }
}

/** Llamar en logout: resetea y deja la DB sin dueño. */
export async function releaseLocalData(): Promise<void> {
  try {
    await resetLocalData();
    await AsyncStorage.removeItem(DB_OWNER_KEY);
  } catch (err) {
    // El logout no debe fallar por esto, pero dejamos rastro.
    console.warn('[localReset] release failed:', err);
  }
}
