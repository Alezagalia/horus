/**
 * FoodFormModal - crear/editar alimento
 * F-17 Sprint 1
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFoodSchema, type Food, type CreateFoodDTO } from '@horus/shared';
import { useCreateFood, useUpdateFood } from '@/hooks/useNutrition';

interface FoodFormModalProps {
  open: boolean;
  onClose: () => void;
  food?: Food | null;
}

export function FoodFormModal({ open, onClose, food }: FoodFormModalProps) {
  const { mutate: createFood, isPending: creating } = useCreateFood();
  const { mutate: updateFood, isPending: updating } = useUpdateFood();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFoodDTO>({
    resolver: zodResolver(createFoodSchema),
    defaultValues: { unit: 'g' },
  });

  useEffect(() => {
    if (food) {
      reset({
        name: food.name,
        brand: food.brand ?? undefined,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber ?? undefined,
        unit: food.unit,
      });
    } else {
      reset({ unit: 'g' });
    }
  }, [food, reset]);

  if (!open) return null;

  const onSubmit = (data: CreateFoodDTO) => {
    if (food) {
      updateFood(
        { id: food.id, data },
        {
          onSuccess: () => {
            reset();
            onClose();
          },
        }
      );
    } else {
      createFood(data, {
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    }
  };

  const isPending = creating || updating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {food ? 'Editar alimento' : 'Nuevo alimento'}
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
                placeholder="ej. Pollo a la plancha"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                {...register('brand')}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                <select
                  {...register('unit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="g">gramos (g)</option>
                  <option value="ml">mililitros (ml)</option>
                  <option value="u">unidad (u)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calorías / 100u *
                </label>
                <input
                  {...register('calories', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.calories && (
                  <p className="text-red-500 text-xs mt-1">{errors.calories.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proteína (g) *
                </label>
                <input
                  {...register('protein', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.protein && (
                  <p className="text-red-500 text-xs mt-1">{errors.protein.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbohidratos (g) *
                </label>
                <input
                  {...register('carbs', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.carbs && (
                  <p className="text-red-500 text-xs mt-1">{errors.carbs.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grasa (g) *</label>
                <input
                  {...register('fat', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.fat && <p className="text-red-500 text-xs mt-1">{errors.fat.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fibra (g)</label>
                <input
                  {...register('fiber', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="opcional"
                />
              </div>
            </div>

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
                {isPending ? 'Guardando...' : food ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
