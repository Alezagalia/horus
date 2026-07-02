import { create } from 'zustand';

/**
 * Estado observable del sync offline-first (dominio Dinero).
 * Lo actualiza `syncScheduler`; la UI lo consume para mostrar el indicador
 * de "pendiente de sincronizar" / "sincronizando" / último sync.
 */
interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  /** Hay escrituras locales que todavía no llegaron al server. */
  hasPending: boolean;
  lastError: string | null;
  setSyncing: (isSyncing: boolean) => void;
  setSyncResult: (result: { ok: boolean; error?: string }) => void;
  setHasPending: (hasPending: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  hasPending: false,
  lastError: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncResult: ({ ok, error }) =>
    set({
      isSyncing: false,
      ...(ok ? { lastSyncAt: Date.now(), lastError: null } : { lastError: error ?? 'sync failed' }),
    }),
  setHasPending: (hasPending) => set({ hasPending }),
}));
