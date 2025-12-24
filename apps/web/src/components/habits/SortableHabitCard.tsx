/**
 * Sortable Habit Card Component
 * Sprint 13 - Drag & Drop Reordering
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HabitCard } from './HabitCard';
import type { HabitOfDay } from '@/types/habits';

interface SortableHabitCardProps {
  habit: HabitOfDay;
  onToggleComplete?: (habitId: string) => void;
  onUpdateValue?: (habitId: string, value: number) => void;
  onUpdateNotes?: (habitId: string, notes: string) => void;
  disabled?: boolean;
}

export function SortableHabitCard({
  habit,
  onToggleComplete,
  onUpdateValue,
  onUpdateNotes,
  disabled = false,
}: SortableHabitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 touch-none"
      >
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      {/* Offset the card content to make room for drag handle */}
      <div className="pl-8">
        <HabitCard
          habit={habit}
          onToggleComplete={onToggleComplete}
          onUpdateValue={onUpdateValue}
          onUpdateNotes={onUpdateNotes}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
