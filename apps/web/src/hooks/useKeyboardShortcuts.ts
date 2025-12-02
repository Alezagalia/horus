/**
 * Keyboard Shortcuts Hook
 * Sprint 11 - US-103
 *
 * Sistema global de atajos de teclado para navegación y acciones rápidas
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export interface KeyboardShortcut {
  keys: string;
  description: string;
  category: 'navigation' | 'actions' | 'general';
  handler?: () => void;
}

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
  enableNavigation?: boolean;
  enableActions?: boolean;
}

/**
 * Hook principal para configurar todos los atajos de teclado globales
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onShowHelp, enableNavigation = true } = options;

  const navigate = useNavigate();

  // Definición de todos los atajos disponibles
  const shortcuts: KeyboardShortcut[] = [
    // General
    {
      keys: 'shift+?',
      description: 'Mostrar ayuda de atajos',
      category: 'general',
    },
    {
      keys: 'escape',
      description: 'Cerrar modal/diálogo',
      category: 'general',
    },
    {
      keys: 'slash',
      description: 'Enfocar búsqueda',
      category: 'general',
    },

    // Navegación
    {
      keys: 'g+h',
      description: 'Ir a Dashboard (Home)',
      category: 'navigation',
      handler: () => navigate('/'),
    },
    {
      keys: 'g+t',
      description: 'Ir a Hábitos del Día (Today)',
      category: 'navigation',
      handler: () => navigate('/habits/today'),
    },
    {
      keys: 'g+m',
      description: 'Ir a Mis Hábitos',
      category: 'navigation',
      handler: () => navigate('/habits'),
    },
    {
      keys: 'g+k',
      description: 'Ir a Tareas (tasKs)',
      category: 'navigation',
      handler: () => navigate('/tasks'),
    },
    {
      keys: 'g+c',
      description: 'Ir a Categorías',
      category: 'navigation',
      handler: () => navigate('/categories'),
    },

    // Acciones en listas
    {
      keys: 'j',
      description: 'Seleccionar siguiente item',
      category: 'actions',
    },
    {
      keys: 'k',
      description: 'Seleccionar item anterior',
      category: 'actions',
    },
    {
      keys: 'space',
      description: 'Marcar/desmarcar completado',
      category: 'actions',
    },
    {
      keys: 'n',
      description: 'Crear nuevo item',
      category: 'actions',
    },
    {
      keys: 'e',
      description: 'Editar item seleccionado',
      category: 'actions',
    },
    {
      keys: 'd',
      description: 'Eliminar item seleccionado',
      category: 'actions',
    },
    {
      keys: 'enter',
      description: 'Abrir detalles del item',
      category: 'actions',
    },

    // Formularios
    {
      keys: 'ctrl+enter, meta+enter',
      description: 'Guardar formulario',
      category: 'actions',
    },
  ];

  // Handler para mostrar ayuda
  const handleShowHelp = useCallback(() => {
    onShowHelp?.();
  }, [onShowHelp]);

  // Configurar atajos de ayuda
  useHotkeys('shift+?', handleShowHelp, {
    preventDefault: true,
    enableOnFormTags: false,
  });

  // Configurar atajos de navegación
  if (enableNavigation) {
    shortcuts
      .filter((s) => s.category === 'navigation' && s.handler)
      .forEach((shortcut) => {
        useHotkeys(
          shortcut.keys,
          () => {
            shortcut.handler?.();
          },
          {
            preventDefault: true,
            enableOnFormTags: false,
          }
        );
      });
  }

  return {
    shortcuts,
  };
}

/**
 * Hook para atajos en búsqueda
 */
export function useSearchShortcut(searchInputRef: React.RefObject<HTMLInputElement>) {
  useHotkeys(
    'slash',
    (e) => {
      e.preventDefault();
      searchInputRef.current?.focus();
    },
    {
      enableOnFormTags: false,
    }
  );
}

/**
 * Hook para navegación en listas (j/k)
 */
export function useListNavigation(options: {
  itemCount: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onAction?: (action: 'toggle' | 'new' | 'edit' | 'delete' | 'open') => void;
  enabled?: boolean;
}) {
  const { itemCount, selectedIndex, onSelectIndex, onAction, enabled = true } = options;

  // j - siguiente item
  useHotkeys(
    'j',
    () => {
      if (!enabled || itemCount === 0) return;
      const nextIndex = Math.min(selectedIndex + 1, itemCount - 1);
      onSelectIndex(nextIndex);
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [enabled, itemCount, selectedIndex, onSelectIndex]
  );

  // k - item anterior
  useHotkeys(
    'k',
    () => {
      if (!enabled || itemCount === 0) return;
      const prevIndex = Math.max(selectedIndex - 1, 0);
      onSelectIndex(prevIndex);
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [enabled, itemCount, selectedIndex, onSelectIndex]
  );

  // Space - toggle completado
  useHotkeys(
    'space',
    (e) => {
      if (!enabled || selectedIndex < 0) return;
      e.preventDefault();
      onAction?.('toggle');
    },
    {
      enableOnFormTags: false,
    },
    [enabled, selectedIndex, onAction]
  );

  // n - nuevo item
  useHotkeys(
    'n',
    () => {
      if (!enabled) return;
      onAction?.('new');
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [enabled, onAction]
  );

  // e - editar
  useHotkeys(
    'e',
    () => {
      if (!enabled || selectedIndex < 0) return;
      onAction?.('edit');
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [enabled, selectedIndex, onAction]
  );

  // d - eliminar
  useHotkeys(
    'd',
    () => {
      if (!enabled || selectedIndex < 0) return;
      onAction?.('delete');
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [enabled, selectedIndex, onAction]
  );

  // Enter - abrir detalles
  useHotkeys(
    'enter',
    () => {
      if (!enabled || selectedIndex < 0) return;
      onAction?.('open');
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [enabled, selectedIndex, onAction]
  );
}

/**
 * Hook para atajos en formularios
 */
export function useFormShortcuts(options: {
  onSubmit?: () => void;
  onCancel?: () => void;
  enabled?: boolean;
}) {
  const { onSubmit, onCancel, enabled = true } = options;

  // Ctrl/Cmd + Enter - guardar
  useHotkeys(
    'ctrl+enter, meta+enter',
    (e) => {
      if (!enabled) return;
      e.preventDefault();
      onSubmit?.();
    },
    {
      enableOnFormTags: true,
    },
    [enabled, onSubmit]
  );

  // Escape - cancelar
  useHotkeys(
    'escape',
    () => {
      if (!enabled) return;
      onCancel?.();
    },
    {
      enableOnFormTags: true,
    },
    [enabled, onCancel]
  );
}
