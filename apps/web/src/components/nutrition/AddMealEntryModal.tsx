/**
 * AddMealEntryModal - agregar comida al plan
 * F-17 Sprint 2
 */

import { useState } from 'react';
import type { MealTime, Food, RecipeWithIngredients } from '@horus/shared';
import { useFoods, useRecipes, useAddMealEntry } from '@/hooks/useNutrition';

const MEAL_TIME_LABELS: Record<MealTime, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'Media Mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda',
  DINNER: 'Cena',
};

type Mode = 'recipe' | 'food';

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
  const { data: recipes = [] } = useRecipes();
  const { mutate: addEntry, isPending } = useAddMealEntry();

  const [mode, setMode] = useState<Mode>('recipe');
  const [search, setSearch] = useState('');

  // Recipe mode state
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
  const [servings, setServings] = useState('3');

  // Food mode state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');

  const [notes, setNotes] = useState('');

  if (!open) return null;

  const filteredRecipes = search
    ? recipes.filter((r) => r?.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  const filteredFoods = search
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods;

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setSearch('');
    setSelectedRecipe(null);
    setSelectedFood(null);
  };

  const canSubmit =
    mode === 'recipe'
      ? selectedRecipe !== null && parseFloat(servings) > 0
      : selectedFood !== null && parseFloat(grams) > 0;

  const handleAdd = () => {
    if (!canSubmit) return;

    const item =
      mode === 'recipe'
        ? { recipeId: selectedRecipe!.id, servings: parseFloat(servings), grams: 1 }
        : { foodId: selectedFood!.id, grams: parseFloat(grams) };

    addEntry(
      {
        mealPlanId,
        data: {
          day,
          mealTime,
          notes: notes || null,
          items: [item],
        },
      },
      {
        onSuccess: () => {
          setSelectedRecipe(null);
          setSelectedFood(null);
          setServings('3');
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
          {/* Header */}
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
            {/* Mode toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleModeChange('recipe')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'recipe'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🍳 Receta
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('food')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'food'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🥗 Alimento
              </button>
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === 'recipe' ? 'Buscar receta...' : 'Buscar alimento...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* List */}
            {mode === 'recipe' ? (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredRecipes.map(
                  (r) =>
                    r && (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRecipe(r)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                          selectedRecipe?.id === r.id
                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {Math.round(r.macrosPerServing.calories)} kcal/porción · {r.servings}{' '}
                          porc.
                        </span>
                      </button>
                    )
                )}
                {filteredRecipes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Sin resultados</p>
                )}
              </div>
            ) : (
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
            )}

            {/* Quantity input */}
            {mode === 'recipe' && selectedRecipe && (
              <div className="flex gap-2 items-center bg-indigo-50 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-700 flex-1 truncate font-medium">
                  {selectedRecipe.name}
                </span>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  min="0.5"
                  step="0.5"
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-500 shrink-0">porc.</span>
              </div>
            )}

            {mode === 'food' && selectedFood && (
              <div className="flex gap-2 items-center bg-gray-50 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-700 flex-1 truncate font-medium">
                  {selectedFood.name}
                </span>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  min="1"
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-500 shrink-0">{selectedFood.unit}</span>
              </div>
            )}

            {/* Notes */}
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Actions */}
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
                disabled={!canSubmit || isPending}
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
