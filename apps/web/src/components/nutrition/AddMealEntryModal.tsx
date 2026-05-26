/**
 * AddMealEntryModal - agregar comida al plan
 * F-17 Sprint 2
 */

import { useState } from 'react';
import type { MealTime, Food } from '@horus/shared';
import { useFoods, useAddMealEntry } from '@/hooks/useNutrition';

const MEAL_TIME_LABELS: Record<MealTime, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Media Mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda',
  DINNER: 'Cena',
};

interface AddMealEntryModalProps {
  open: boolean;
  onClose: () => void;
  mealPlanId: string;
  day: string;
  mealTime: MealTime;
}

export function AddMealEntryModal({
  open,
  onClose,
  mealPlanId,
  day,
  mealTime,
}: AddMealEntryModalProps) {
  const { data: foods = [] } = useFoods();
  const { mutate: addEntry, isPending } = useAddMealEntry();
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filteredFoods = search
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods;

  const handleAdd = () => {
    if (!selectedFood || !grams) return;
    addEntry(
      {
        mealPlanId,
        data: {
          day,
          mealTime,
          notes: notes || null,
          items: [{ foodId: selectedFood.id, grams: parseFloat(grams) }],
        },
      },
      {
        onSuccess: () => {
          setSelectedFood(null);
          setGrams('100');
          setNotes('');
          setSearch('');
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Agregar a {MEAL_TIME_LABELS[mealTime]}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          <div className="space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredFoods.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFood(f)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    selectedFood?.id === f.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {Math.round(f.calories)} kcal/100{f.unit}
                  </span>
                </button>
              ))}
              {filteredFoods.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Sin resultados</p>
              )}
            </div>

            {selectedFood && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-700 flex-1 truncate">{selectedFood.name}</span>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  min="1"
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-500">{selectedFood.unit}</span>
              </div>
            )}

            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedFood || isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
              >
                {isPending ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
