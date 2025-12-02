/**
 * Keyboard Shortcuts Provider
 * Sprint 11 - US-103
 *
 * Componente que provee el contexto global de atajos de teclado
 */

import { useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [showHelp, setShowHelp] = useState(false);

  const { shortcuts } = useKeyboardShortcuts({
    onShowHelp: () => setShowHelp(true),
    enableNavigation: true,
    enableActions: false, // Las acciones se habilitan en cada página específica
  });

  return (
    <>
      {children}
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />
    </>
  );
}
