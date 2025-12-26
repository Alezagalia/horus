/**
 * Execute Routine Page (MVP)
 * Sprint 14 - US-138
 *
 * MVP SIMPLIFICADO: Layout 1-2 columnas en lugar de 3, sin timer de descanso complejo
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import {
  startWorkout,
  addSet,
  finishWorkout,
  cancelWorkout,
  type AddSetInput,
  type StartWorkoutResponse,
} from '@/services/api/workoutApi';

interface SetLocal {
  tempId: string;
  reps: number;
  weight: number;
}

interface ExerciseLocal {
  workoutExerciseId: string;
  sets: SetLocal[];
}

export function ExecuteRoutinePage() {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();

  // Workout data
  const [workoutData, setWorkoutData] = useState<StartWorkoutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercisesLocal, setExercisesLocal] = useState<Record<string, ExerciseLocal>>({});

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime] = useState(Date.now());

  // Add set modal
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [newSetReps, setNewSetReps] = useState<string>('10');
  const [newSetWeight, setNewSetWeight] = useState<string>('20');

  // Finish modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishNotes, setFinishNotes] = useState('');

  // Conflict modal (active workout)
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeWorkoutTime, setActiveWorkoutTime] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Start workout on mount
  useEffect(() => {
    if (!routineId) return;

    startWorkout(routineId)
      .then((data) => {
        setWorkoutData(data);
        // Initialize local state
        const initial: Record<string, ExerciseLocal> = {};
        data.exercises.forEach((ex) => {
          initial[ex.workoutExerciseId] = {
            workoutExerciseId: ex.workoutExerciseId,
            sets: [],
          };
        });
        setExercisesLocal(initial);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error completo:', error);
        console.error('Error.response:', error?.response);
        console.error('Error.response.data:', error?.response?.data);
        console.error('Error.response.status:', error?.response?.status);
        console.error('Error.response.data.meta:', error?.response?.data?.meta);
        console.error('Condición 1 (status === 409):', error?.response?.status === 409);
        console.error('Condición 2 (meta exists):', !!error?.response?.data?.meta);

        // Check if it's a conflict error (409) - active workout exists
        if (error?.response?.status === 409 && error?.response?.data?.meta) {
          console.log('✅ Entrando a mostrar modal de conflicto');
          const { workoutId, startTime } = error.response.data.meta;
          console.log('workoutId:', workoutId, 'startTime:', startTime);
          setActiveWorkoutId(workoutId);
          setActiveWorkoutTime(startTime);
          setShowConflictModal(true);
          setIsLoading(false);
        } else {
          console.log('❌ No se cumple la condición, mostrando error genérico');
          toast.error('Error al iniciar workout');
          navigate('/routines');
        }
      });
  }, [routineId, navigate]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddSet = async () => {
    if (!workoutData) return;

    const reps = parseInt(newSetReps);
    const weight = parseFloat(newSetWeight);

    if (isNaN(reps) || isNaN(weight) || reps <= 0 || weight < 0) {
      toast.error('Valores inválidos');
      return;
    }

    const currentExercise = workoutData.exercises[currentExerciseIndex];
    const data: AddSetInput = { reps, weight };

    try {
      await addSet(workoutData.workout.id, currentExercise.workoutExerciseId, data);

      // Update local state
      setExercisesLocal((prev) => ({
        ...prev,
        [currentExercise.workoutExerciseId]: {
          ...prev[currentExercise.workoutExerciseId],
          sets: [
            ...prev[currentExercise.workoutExerciseId].sets,
            {
              tempId: `temp-${Date.now()}`,
              reps,
              weight,
            },
          ],
        },
      }));

      toast.success('Serie añadida');
      setShowAddSetModal(false);
      setNewSetReps('10');
      setNewSetWeight('20');
    } catch (error) {
      toast.error('Error al añadir serie');
      console.error(error);
    }
  };

  const handleFinish = async () => {
    if (!workoutData) return;

    try {
      await finishWorkout(workoutData.workout.id, finishNotes || undefined);
      toast.success('Workout completado');
      navigate('/routines');
    } catch (error) {
      toast.error('Error al finalizar workout');
      console.error(error);
    }
  };

  const handleCancel = () => {
    if (!workoutData) return;

    if (window.confirm('¿Seguro que quieres cancelar el workout? Se perderán todos los datos.')) {
      cancelWorkout(workoutData.workout.id)
        .then(() => {
          toast.success('Workout cancelado');
          navigate('/routines');
        })
        .catch((error) => {
          toast.error('Error al cancelar workout');
          console.error(error);
        });
    }
  };

  const handleCancelActiveWorkout = async () => {
    if (!activeWorkoutId) return;

    console.log('🔄 Iniciando cancelación del workout:', activeWorkoutId);
    setIsCancelling(true);
    try {
      console.log('🗑️ Cancelando workout...');
      await cancelWorkout(activeWorkoutId);
      console.log('✅ Workout cancelado exitosamente');
      toast.success('Workout activo cancelado');
      setShowConflictModal(false);

      // Retry starting the workout
      if (routineId) {
        console.log('🔄 Reintentando iniciar workout con routineId:', routineId);
        const data = await startWorkout(routineId);
        console.log('✅ Nuevo workout iniciado:', data);
        setWorkoutData(data);
        // Initialize local state
        const initial: Record<string, ExerciseLocal> = {};
        // Note: backend returns data.exercises directly, not data.routine.exercises
        data.exercises.forEach((ex) => {
          initial[ex.workoutExerciseId] = {
            workoutExerciseId: ex.workoutExerciseId,
            sets: [],
          };
        });
        setExercisesLocal(initial);
        setIsLoading(false);
        console.log('✅ Estados actualizados correctamente');
      }
    } catch (error) {
      console.error('❌ Error en handleCancelActiveWorkout:', error);
      toast.error('Error al cancelar workout activo');
      setShowConflictModal(false);
      navigate('/routines');
    } finally {
      setIsCancelling(false);
      console.log('🏁 Finalizó handleCancelActiveWorkout');
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleNextExercise = () => {
    if (workoutData && currentExerciseIndex < workoutData.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const getHistory = (exerciseId: string) => {
    if (!workoutData) return null;
    const exercise = workoutData.exercises.find((ex) => ex.exerciseId === exerciseId);
    return exercise?.lastWorkoutData || null;
  };

  // Debug: log state changes
  console.log('🔍 Estado actual:', {
    isLoading,
    hasWorkoutData: !!workoutData,
    showConflictModal,
    activeWorkoutId,
    activeWorkoutTime,
  });

  // Show conflict modal if there's an active workout
  if (showConflictModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />

        {/* Conflict Modal - Active Workout Exists */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Workout en Progreso</h3>
                <p className="text-gray-600 mt-1">
                  Ya tienes un entrenamiento activo iniciado
                  {activeWorkoutTime && (
                    <> el {new Date(activeWorkoutTime).toLocaleString('es-ES')}</>
                  )}
                  .
                </p>
                <p className="text-gray-600 mt-2">
                  Debes cancelar o finalizar el workout anterior antes de iniciar uno nuevo.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConflictModal(false);
                  navigate('/routines');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleCancelActiveWorkout}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar Workout Anterior'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !workoutData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Iniciando workout...</p>
        </div>
      </div>
    );
  }

  const currentExercise = workoutData.exercises[currentExerciseIndex];
  const currentSets = exercisesLocal[currentExercise.workoutExerciseId]?.sets || [];
  const history = getHistory(currentExercise.exerciseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workoutData.workout.routineName}</h1>
              <p className="text-sm text-gray-600">
                Ejercicio {currentExerciseIndex + 1} de {workoutData.exercises.length}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-xs text-gray-500">Tiempo</div>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowFinishModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Finalizar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Exercise List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ejercicios</h2>
              <div className="space-y-2">
                {workoutData.exercises.map((ex, index) => {
                  const setsCount = exercisesLocal[ex.workoutExerciseId]?.sets.length || 0;
                  return (
                    <button
                      key={ex.workoutExerciseId}
                      onClick={() => setCurrentExerciseIndex(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        index === currentExerciseIndex
                          ? 'bg-indigo-100 border-2 border-indigo-600'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ex.exerciseName}</p>
                          {ex.muscleGroup && (
                            <p className="text-xs text-gray-500">{ex.muscleGroup}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">{setsCount} series</p>
                          {ex.targetSets && (
                            <p className="text-xs text-gray-500">/{ex.targetSets}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Current Exercise */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exercise Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentExercise.exerciseName}
                  </h2>
                  {currentExercise.muscleGroup && (
                    <p className="text-gray-600 mt-1">{currentExercise.muscleGroup}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousExercise}
                    disabled={currentExerciseIndex === 0}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextExercise}
                    disabled={currentExerciseIndex === workoutData.exercises.length - 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Targets */}
              {(currentExercise.targetSets ||
                currentExercise.targetReps ||
                currentExercise.targetWeight) && (
                <div className="flex gap-4 text-sm text-gray-600">
                  {currentExercise.targetSets && (
                    <div>
                      <span className="font-medium">Series:</span> {currentExercise.targetSets}
                    </div>
                  )}
                  {currentExercise.targetReps && (
                    <div>
                      <span className="font-medium">Reps:</span> {currentExercise.targetReps}
                    </div>
                  )}
                  {currentExercise.targetWeight && (
                    <div>
                      <span className="font-medium">Peso:</span> {currentExercise.targetWeight} kg
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History */}
            {history && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Última Vez ({new Date(history.date).toLocaleDateString('es-ES')})
                </h3>
                <div className="space-y-2">
                  {history.allSets.map((set, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">Serie {set.setNumber}</span>
                      <span className="font-medium">
                        {set.reps} reps × {set.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Sets */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Series de Hoy</h3>
                <button
                  onClick={() => setShowAddSetModal(true)}
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
                  Agregar Serie
                </button>
              </div>

              {currentSets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Sin series registradas</p>
                  <p className="text-sm">Agrega tu primera serie</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentSets.map((set, index) => (
                    <div
                      key={set.tempId}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-700">Serie {index + 1}</span>
                      <span className="text-gray-900">
                        {set.reps} reps × {set.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Set Modal */}
      {showAddSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Serie</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repeticiones</label>
                <input
                  type="number"
                  value={newSetReps}
                  onChange={(e) => setNewSetReps(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="1"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  value={newSetWeight}
                  onChange={(e) => setNewSetWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSetModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSet}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Finalizar Workout</h3>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">Duración: {formatTime(elapsedSeconds)}</p>
              <p className="text-gray-600 mb-2">
                Series totales:{' '}
                {Object.values(exercisesLocal).reduce((sum, ex) => sum + ex.sets.length, 0)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={finishNotes}
                onChange={(e) => setFinishNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="¿Cómo te sentiste? ¿Alguna observación?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
