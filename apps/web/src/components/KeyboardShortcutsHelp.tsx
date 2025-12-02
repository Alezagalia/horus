/**
 * Keyboard Shortcuts Help Modal
 * Sprint 11 - US-103
 *
 * Modal que muestra todos los atajos de teclado disponibles
 */

import { useEffect } from 'react';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Agrupar shortcuts por categoría
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const categoryTitles: Record<string, string> = {
    general: 'General',
    navigation: 'Navegación',
    actions: 'Acciones',
  };

  const categoryOrder: Array<keyof typeof categoryTitles> = ['general', 'navigation', 'actions'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Atajos de Teclado</h2>
              <p className="text-sm text-gray-600 mt-1">Navega más rápido con estos atajos</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {categoryOrder.map((category) => {
              const categoryShortcuts = groupedShortcuts[category];
              if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    {category === 'general' && (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    {category === 'navigation' && (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    )}
                    {category === 'actions' && (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    )}
                    {categoryTitles[category]}
                  </h3>

                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {formatKeys(shortcut.keys).map((key, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg">
            <p className="text-sm text-gray-600 text-center">
              Presiona{' '}
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm">
                Esc
              </kbd>{' '}
              para cerrar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Formatea las teclas para mostrarlas en el modal
 */
function formatKeys(keys: string): string[] {
  // Tomar solo la primera combinación si hay múltiples (separadas por coma)
  const firstCombo = keys.split(',')[0].trim();

  // Dividir por + para las combinaciones
  const parts = firstCombo.split('+').map((part) => part.trim());

  return parts.map((part) => {
    // Reemplazar nombres de teclas especiales
    const keyMap: Record<string, string> = {
      ctrl: '⌃ Ctrl',
      meta: '⌘ Cmd',
      shift: '⇧ Shift',
      alt: '⌥ Alt',
      enter: '↵ Enter',
      escape: 'Esc',
      space: 'Space',
      slash: '/',
      g: 'G',
      h: 'H',
      t: 'T',
      m: 'M',
      k: 'K',
      c: 'C',
      j: 'J',
      n: 'N',
      e: 'E',
      d: 'D',
      '?': '?',
    };

    return keyMap[part.toLowerCase()] || part.toUpperCase();
  });
}
