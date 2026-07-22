import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api/authApi';
import { useAuthStore } from './authStore';

/**
 * Estado del wizard de onboarding.
 *
 * La fuente de verdad del flag es el backend (User.onboardingCompletedAt,
 * sobrevive reinstalaciones). El set local en AsyncStorage es el fallback
 * para que completar/saltar el wizard funcione offline: sostiene el guard
 * hasta que el PATCH llegue al backend.
 */

const STORAGE_KEY = 'horus_onboarding_done';

interface OnboardingState {
  /** userIds que completaron el wizard localmente (fallback offline). */
  localCompleted: Set<string>;
  hydrated: boolean;
  /** Intereses elegidos en el paso 1 — efímero, solo dirige el flujo. */
  interests: string[];

  hydrate: () => Promise<void>;
  setInterests: (interests: string[]) => void;
  markCompleted: (userId: string) => Promise<void>;
}

async function persistLocal(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // best-effort
  }
}

/** PATCH best-effort + update optimista del user en authStore. */
async function syncCompletionToBackend(): Promise<void> {
  try {
    const user = await authApi.updateProfile({ onboardingCompleted: true });
    useAuthStore.getState().setUser(user);
  } catch {
    // Offline o backend caído: el flag local sostiene el guard; se reintenta
    // en la próxima hidratación (ver hydrate).
  }
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  localCompleted: new Set<string>(),
  hydrated: false,
  interests: [],

  hydrate: async () => {
    if (get().hydrated) return;
    let ids = new Set<string>();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) ids = new Set(JSON.parse(raw) as string[]);
    } catch {
      // corrupto o inaccesible: arrancamos vacío
    }
    set({ localCompleted: ids, hydrated: true });

    // Reintento: si el user actual completó localmente pero el backend aún no
    // lo sabe (PATCH falló en su momento), lo reenviamos.
    const user = useAuthStore.getState().user;
    if (user && ids.has(user.id) && user.onboardingCompletedAt == null) {
      void syncCompletionToBackend();
    }
  },

  setInterests: (interests) => set({ interests }),

  markCompleted: async (userId) => {
    const ids = new Set(get().localCompleted);
    ids.add(userId);
    // Primero el estado local (el guard debe ver "completado" ANTES de navegar
    // a tabs, si no habría loop de redirección), después la persistencia.
    set({ localCompleted: ids, interests: [] });
    await persistLocal(ids);
    void syncCompletionToBackend();
  },
}));
