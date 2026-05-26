/**
 * NutritionLogDay - registro diario de alimentación
 * F-17 Sprint 3
 */

import { useState } from 'react';
import type { NutritionLog, MealTime, Food } from '@horus/shared';
import { MacrosBadge } from './MacrosBadge';
import { MacrosBar } from './MacrosBar';
import { useFoods, useUpsertNutritionLog } from '@/hooks/useNutrition';

const MEAL_TIME_LABELS: Record<MealTime, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Media Mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda',
  DINNER: 'Cena',
};

const MEAL_TIMES: MealTime[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

interface NutritionLogDayProps {
  date: string;
  log: NutritionLog | null;
}

export function NutritionLogDay({ date, log }: NutritionLogDayProps) {
  const { data: foods = [] } = useFoods();
  const { mutate: upsert, isPending } = useUpsertNutritionLog();

  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('BREAKFAST');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');
  const [search, setSearch] = useState('');

  const filteredFoods = search
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods;

  const currentItems = log?.items ?? [];

  const handleAddItem = () => {
    if (!selectedFood) return;
    const newItem = {
      foodId: selectedFood.id,
      mealTime: selectedMealTime,
      grams: parseFloat(grams),
    };
    const existingItems = currentItems.map((i) => ({
      foodId: i.foodId ?? undefined,
      mealTime: i.mealTime as MealTime,
      grams: i.grams,
      servings: i.servings ?? undefined,
      notes: i.notes ?? undefined,
    }));
    upsert(
      { date, data: { items: [...existingItems, newItem] } },
      {
        onSuccess: () => {
          setSelectedFood(null);
          setGrams('100');
          setSearch('');
        },
      }
    );
  };

  const handleRemoveItem = (index: number) => {
    const items = currentItems
      .filter((_, i) => i !== index)
      .map((i) => ({
        foodId: i.foodId ?? undefined,
        mealTime: i.mealTime as MealTime,
        grams: i.grams,
      }));
    upsert({ date, data: { items } });
  };

  return (
    <div className="space-y-4">
      {log && <MacrosBar current={log.dayMacros} />}

      {/* Add food form */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Agregar alimento</h3>
        <div className="flex gap-2 flex-wrap">
          {MEAL_TIMES.map((mt) => (
            <button
              key={mt}
              onClick={() => setSelectedMealTime(mt)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedMealTime === mt
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {MEAL_TIME_LABELS[mt]}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimento..."
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {search && (
          <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-1">
            {filteredFoods.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedFood(f);
                  setSearch(f.name);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {f.name}{' '}
                <span className="text-xs text-gray-400">
                  {Math.round(f.calories)} kcal/100{f.unit}
                </span>
              </button>
            ))}
          </div>
        )}

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
            <button
              onClick={handleAddItem}
              disabled={isPending}
              className="px-4 py-1.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Agregar'}
            </button>
          </div>
        )}
      </div>

      {/* Items by meal time */}
      {MEAL_TIMES.map((mt) => {
        const items = currentItems.filter((i) => i.mealTime === mt);
        if (items.length === 0) return null;
        return (
          <div key={mt} className="glass-card p-4 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{MEAL_TIME_LABELS[mt]}</h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-700">{item.food?.name ?? '—'}</span>
                  <span className="text-xs text-gray-500">{item.grams}g</span>
                  <MacrosBadge macros={item.macros} size="sm" />
                  <button
                    onClick={() => handleRemoveItem(currentItems.indexOf(item))}
                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>
          </div>
        );
      })}

      {currentItems.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">
          Sin registro para hoy. Agrega alimentos arriba.
        </p>
      )}
    </div>
  );
}
