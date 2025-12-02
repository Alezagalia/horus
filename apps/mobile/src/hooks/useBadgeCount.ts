/**
 * useBadgeCount Hook
 * Sprint 12 - US-106
 *
 * Hook para actualizar el badge count basado en hábitos pendientes
 */

import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setBadgeCount, clearBadge } from '../services/push-notifications';

export interface BadgeCountItem {
  id: string;
  completed: boolean;
}

export interface UseBadgeCountOptions {
  /**
   * Items pendientes (hábitos, tareas, etc.)
   */
  items: BadgeCountItem[];

  /**
   * Si es true, actualiza el badge automáticamente
   */
  autoUpdate?: boolean;

  /**
   * Si es true, limpia el badge cuando todos los items están completados
   */
  autoClear?: boolean;
}

/**
 * Hook para manejar el badge count de la app
 *
 * Actualiza el badge automáticamente basado en items pendientes
 * y escucha cambios de AppState para actualizar cuando vuelve al foreground
 *
 * @param options Opciones de configuración
 */
export function useBadgeCount(options: UseBadgeCountOptions) {
  const { items, autoUpdate = true, autoClear = true } = options;

  // Calcular número de items pendientes
  const pendingCount = items.filter((item) => !item.completed).length;

  useEffect(() => {
    if (!autoUpdate) return;

    updateBadge();

    // Listener para actualizar badge cuando app vuelve al foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [items, autoUpdate, autoClear]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      updateBadge();
    }
  };

  const updateBadge = async () => {
    try {
      if (pendingCount === 0 && autoClear) {
        await clearBadge();
      } else {
        await setBadgeCount(pendingCount);
      }
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  return {
    pendingCount,
    updateBadge,
  };
}
