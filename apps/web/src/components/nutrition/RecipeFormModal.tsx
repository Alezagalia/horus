/**
 * RecipeFormModal - crear/editar receta con ingredientes
 * F-17 Sprint 1
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRecipeSchema,
  type RecipeWithIngredients,
  type CreateRecipeDTO,
  type Food,
} from '@horus/shared';
import {
  useCreateRecipe,
  useUpdateRecipe,
  useAddIngredient,
  useRemoveIngredient,
  useFoods,
} from '@/hooks/useNutrition';

interface RecipeFormModalProps {
  open: boolean;
  onClose: () => void;
  recipe?: RecipeWithIngredients | null;
}

export function RecipeFormModal({ open, onClose, recipe }: RecipeFormModalProps) {
  const { data: foods = [] } = useFoods();
  const { mutate: createRecipe, isPending: creating } = useCreateRecipe();
  const { mutate: updateRecipe, isPending: updating } = useUpdateRecipe();
  const { mutate: addIngredient, isPending: addingIng } = useAddIngredient();
  const { mutate: removeIngredient } = useRemoveIngredient();

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [ingGrams, setIngGrams] = useState('100');
  const [ingNotes, setIngNotes] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRecipeDTO>({
    resolver: zodResolver(createRecipeSchema),
    defaultValues: { servings: 1 },
  });

  useEffect(() => {
    if (recipe) {
      reset({
        name: recipe.name,
        description: recipe.description ?? undefined,
        servings: recipe.servings,
      });
    } else {
      reset({ servings: 1 });
    }
  }, [recipe, reset]);

  if (!open) return null;

  const onSubmit = (data: CreateRecipeDTO) => {
    if (recipe) {
      updateRecipe(
        { id: recipe.id, data },
        {
          onSuccess: () => {
            reset();
            onClose();
          },
        }
      );
    } else {
      createRecipe(data, {
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    }
  };

  const handleAddIngredient = () => {
    if (!recipe || !selectedFood || !ingGrams) return;
    addIngredient(
      {
        recipeId: recipe.id,
        data: { foodId: selectedFood.id, grams: parseFloat(ingGrams), notes: ingNotes || null },
      },
      {
        onSuccess: () => {
          setSelectedFood(null);
          setIngGrams('100');
          setIngNotes('');
        },
      }
    );
  };

  const isPending = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {recipe ? 'Editar receta' : 'Nueva receta'}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="ej. Ensalada mediterránea"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porciones *</label>
              <input
                {...register('servings', { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Ingredients section (only for existing recipes) */}
            {recipe && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Ingredientes</h3>

                <div className="space-y-2 mb-3">
                  {recipe.ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm">{ing.food.name}</span>
                      <span className="text-xs text-gray-500">{ing.grams}g</span>
                      <button
                        type="button"
                        onClick={() =>
                          removeIngredient({ recipeId: recipe.id, ingredientId: ing.id })
                        }
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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

                <div className="flex gap-2">
                  <select
                    value={selectedFood?.id ?? ''}
                    onChange={(e) =>
                      setSelectedFood(foods.find((f) => f.id === e.target.value) ?? null)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar alimento...</option>
                    {foods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={ingGrams}
                    onChange={(e) => setIngGrams(e.target.value)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="g"
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!selectedFood || addingIng}
                    className="px-3 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
              >
                {isPending ? 'Guardando...' : recipe ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
