import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncOffline, hasPendingChanges } from './sync';
import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Orquestador del sync offline-first. Dispara `syncOffline()`:
 *  1. al pasar la app a foreground,
 *  2. al recuperar conectividad (NetInfo),
 *  3. tras escrituras locales (requestSync, debounce 3s),
 *  4. manualmente (syncNow, pull-to-refresh).
 * Serializa las ejecuciones: nunca corren dos synchronize() a la vez
 * (requisito de WatermelonDB); si llega un pedido durante un sync, se
 * encola UNO más al terminar.
 */

const DEBOUNCE_MS = 3_000;

let started = false;
let inFlight = false;
let queued = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let wasConnected: boolean | null = null;

async function refreshPending(): Promise<void> {
  try {
    useSyncStore.getState().setHasPending(await hasPendingChanges());
  } catch {
    // best-effort
  }
}

async function runSync(): Promise<void> {
  if (!useAuthStore.getState().isAuthenticated) return;
  if (inFlight) {
    queued = true;
    return;
  }
  inFlight = true;
  useSyncStore.getState().setSyncing(true);
  try {
    await syncOffline();
    useSyncStore.getState().setSyncResult({ ok: true });
    console.log('[sync] ok');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'sync failed';
    // A logcat: los fallos silenciosos de sync son indebuggeables sin esto.
    // Para AxiosError sumamos URL y causa nativa (p.ej. SSLHandshakeException).
    const ax = error as {
      config?: { url?: string; method?: string };
      cause?: unknown;
      code?: string;
    };
    console.warn(
      '[sync] failed:',
      message,
      '| url:',
      ax.config?.method,
      ax.config?.url,
      '| code:',
      ax.code,
      '| cause:',
      String(ax.cause ?? '-')
    );
    useSyncStore.getState().setSyncResult({ ok: false, error: message });
  } finally {
    inFlight = false;
    await refreshPending();
    if (queued) {
      queued = false;
      void runSync();
    }
  }
}

/** Sync inmediato (pull-to-refresh / botón). Espera a que termine. */
export async function syncNow(): Promise<void> {
  await runSync();
}

/** Pedido de sync tras una escritura local (debounced). */
export function requestSync(): void {
  void refreshPending();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSync();
  }, DEBOUNCE_MS);
}

/** Registra los listeners (una sola vez, desde el layout raíz). */
export function startSyncScheduler(): void {
  if (started) return;
  started = true;

  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void runSync();
      // Refresca el perfil: si el usuario verificó su email (en la web) o
      // cambió su suscripción mientras la app estaba en background, al volver
      // se reflejan sin necesidad de reiniciar la app.
      void useAuthStore.getState().refreshUser();
    }
  });

  NetInfo.addEventListener((state) => {
    const connected = state.isConnected === true;
    if (connected && wasConnected === false) {
      void runSync(); // recuperamos red: subir lo pendiente
    }
    wasConnected = connected;
  });

  // Sync al autenticarse (transición false → true). Cubre el login y —clave—
  // el arranque en frío con sesión ya existente: el runSync() inicial de abajo
  // corre ANTES de que checkAuth() confirme la sesión, así que sin esto la DB
  // local (recién reseteada por un bump de schema) nunca se repoblaba hasta un
  // pull-to-refresh manual.
  useAuthStore.subscribe((state, prev) => {
    if (state.isAuthenticated && !prev.isAuthenticated) {
      void runSync();
    }
  });

  // Sync inicial al abrir la app (si ya hay sesión lista en este punto)
  void runSync();
}
