/**
 * MealEntrySlot - celda del planificador semanal
 * F-17 Sprint 2
 */

import type { MealEntry, MealTime } from '@horus/shared';
import { useDeleteMealEntry } from '@/hooks/useNutrition';

interface MealEntrySlotProps {
  mealPlanId: string;
  day: string;
  mealTime: MealTime;
  entries: MealEntry[];
  onAdd: () => void;
}

export function MealEntrySlot({
  mealPlanId,
  day: _day,
  mealTime: _mealTime,
  entries,
  onAdd,
}: MealEntrySlotProps) {
  const { mutate: deleteEntry } = useDeleteMealEntry();

  if (entries.length === 0) {
    return (
      <button
        onClick={onAdd}
        className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex items-center justify-center text-gray-300 hover:text-indigo-400 text-xs"
      >
        + Agregar
      </button>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-indigo-50 rounded-xl p-2 group relative">
          {entry.items.map((item) => (
            <div key={item.id} className="text-xs text-gray-700 truncate">
              {item.food?.name ?? item.recipe?.name ?? 'Ítem'}
              <span className="text-gray-400 ml-1">{item.grams}g</span>
            </div>
          ))}
          <p className="text-xs text-orange-600 font-semibold mt-0.5">
            {Math.round(entry.macros.calories)} kcal
          </p>
          <button
            onClick={() => deleteEntry({ mealPlanId, entryId: entry.id })}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full text-xs text-indigo-400 hover:text-indigo-600 py-0.5 transition-colors"
      >
        + más
      </button>
    </div>
  );
}
