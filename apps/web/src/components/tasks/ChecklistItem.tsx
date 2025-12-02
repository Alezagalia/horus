/**
 * Checklist Item Component
 * Componente aislado con estado local para actualización visual instantánea
 */

import { useState } from 'react';

interface ChecklistItemProps {
  id: string;
  text: string;
  initialCompleted: boolean;
  onToggle: (itemId: string, currentCompleted: boolean) => void;
}

export function ChecklistItem({ id, text, initialCompleted, onToggle }: ChecklistItemProps) {
  // Estado local independiente - se actualiza inmediatamente al hacer clic
  const [isCompleted, setIsCompleted] = useState(initialCompleted);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Actualizar estado local PRIMERO (visual instantáneo)
    setIsCompleted(!isCompleted);
    // Luego notificar al padre para persistir
    onToggle(id, isCompleted);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
          isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-green-500'
        } flex items-center justify-center`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {text}
      </span>
    </div>
  );
}
