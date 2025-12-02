/**
 * Routine Form Page (MVP sin drag-and-drop)
 * Sprint 14 - US-137
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useRoutine, useCreateRoutine, useUpdateRoutine } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';

interface RoutineExerciseForm {
  tempId: string;
  exerciseId: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  restTime: number | null;
  notes: string | null;
}

export function RoutineFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id && id !== 'new';

  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: routine, isLoading: loadingRoutine } = useRoutine(isEditing ? id : undefined);
  const { data: availableExercises = [], isLoading: loadingExercises } = useExercises();

  // Mutations
  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();

  // Load routine data for edit mode
  useEffect(() => {
    if (routine && isEditing) {
      setName(routine.name);
      setDescription(routine.description || '');
      setExercises(
        routine.exercises.map(
          (ex): RoutineExerciseForm => ({
            tempId: ex.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            restTime: ex.restTime,
            notes: ex.notes,
          })
        )
      );
    }
  }, [routine, isEditing]);

  const handleBack = () => {
    navigate('/routines');
  };

  const handleAddExercises = () => {
    setShowExerciseSelector(true);
  };

  const handleConfirmExercises = () => {
    const newExercises: RoutineExerciseForm[] = Array.from(selectedExercises).map(
      (exerciseId, index) => ({
        tempId: `temp-${Date.now()}-${index}`,
        exerciseId,
        order: exercises.length + index + 1,
        targetSets: 3,
        targetReps: 10,
        targetWeight: null,
        restTime: 60,
        notes: null,
      })
    );

    setExercises([...exercises, ...newExercises]);
    setSelectedExercises(new Set());
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (tempId: string) => {
    setExercises(exercises.filter((ex) => ex.tempId !== tempId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newExercises = [...exercises];
    [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    newExercises.forEach((ex, idx) => (ex.order = idx + 1));
    setExercises(newExercises);
  };

  const handleMoveDown = (index: number) => {
    if (index === exercises.length - 1) return;
    const newExercises = [...exercises];
    [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]];
    newExercises.forEach((ex, idx) => (ex.order = idx + 1));
    setExercises(newExercises);
  };

  const handleExerciseChange = (tempId: string, field: keyof RoutineExerciseForm, value: any) => {
    setExercises(exercises.map((ex) => (ex.tempId === tempId ? { ...ex, [field]: value } : ex)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (exercises.length === 0) {
      toast.error('Debes agregar al menos un ejercicio');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      exercises: exercises.map(({ tempId, ...ex }) => ex),
    };

    if (isEditing) {
      updateRoutineMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            navigate(`/routines/${id}`);
          },
        }
      );
    } else {
      createRoutineMutation.mutate(data, {
        onSuccess: () => {
          navigate('/routines');
        },
      });
    }
  };

  const getExerciseName = (exerciseId: string): string => {
    return availableExercises.find((ex) => ex.id === exerciseId)?.name || 'Desconocido';
  };

  if (loadingRoutine || loadingExercises) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing
            ? 'Modifica los detalles de tu rutina'
            : 'Crea una nueva rutina de entrenamiento'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Información Básica</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: Push Pull Legs"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Descripción de la rutina..."
              />
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ejercicios ({exercises.length})</h2>
            <button
              type="button"
              onClick={handleAddExercises}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar Ejercicios
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">Sin ejercicios</p>
              <p className="text-xs text-gray-500">Agrega ejercicios a tu rutina</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={exercise.tempId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {/* Order buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === exercises.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Order number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Exercise info */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="font-semibold text-gray-900">
                          {getExerciseName(exercise.exerciseId)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Series</label>
                        <input
                          type="number"
                          value={exercise.targetSets || ''}
                          onChange={(e) =>
                            handleExerciseChange(
                              exercise.tempId,
                              'targetSets',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          placeholder="3"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Reps</label>
                        <input
                          type="number"
                          value={exercise.targetReps || ''}
                          onChange={(e) =>
                            handleExerciseChange(
                              exercise.tempId,
                              'targetReps',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          placeholder="10"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          value={exercise.targetWeight || ''}
                          onChange={(e) =>
                            handleExerciseChange(
                              exercise.tempId,
                              'targetWeight',
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          placeholder="20"
                          step="0.5"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Descanso (s)</label>
                        <input
                          type="number"
                          value={exercise.restTime || ''}
                          onChange={(e) =>
                            handleExerciseChange(
                              exercise.tempId,
                              'restTime',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          placeholder="60"
                          min="0"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Notas</label>
                        <input
                          type="text"
                          value={exercise.notes || ''}
                          onChange={(e) =>
                            handleExerciseChange(exercise.tempId, 'notes', e.target.value || null)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                          placeholder="Técnica, consejos..."
                        />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exercise.tempId)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            disabled={createRoutineMutation.isPending || updateRoutineMutation.isPending}
          >
            {createRoutineMutation.isPending || updateRoutineMutation.isPending
              ? 'Guardando...'
              : isEditing
                ? 'Actualizar Rutina'
                : 'Crear Rutina'}
          </button>
        </div>
      </form>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Seleccionar Ejercicios</h3>
              <button
                onClick={() => {
                  setShowExerciseSelector(false);
                  setSelectedExercises(new Set());
                }}
                className="text-gray-400 hover:text-gray-600"
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

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {availableExercises.map((exercise) => (
                  <label
                    key={exercise.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExercises.has(exercise.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedExercises);
                        if (e.target.checked) {
                          newSet.add(exercise.id);
                        } else {
                          newSet.delete(exercise.id);
                        }
                        setSelectedExercises(newSet);
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{exercise.name}</p>
                      {exercise.muscleGroup && (
                        <p className="text-sm text-gray-500">{exercise.muscleGroup}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExerciseSelector(false);
                  setSelectedExercises(new Set());
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExercises}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={selectedExercises.size === 0}
              >
                Agregar ({selectedExercises.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
