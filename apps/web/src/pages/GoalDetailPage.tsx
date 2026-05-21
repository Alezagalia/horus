/**
 * GoalDetailPage
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  useGoal,
  useUpdateGoal,
  useCreateKeyResult,
  useUpdateKeyResult,
  useDeleteKeyResult,
  useLinkHabit,
  useUnlinkHabit,
  useLinkTask,
  useUnlinkTask,
} from '@/hooks/useGoals';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { axiosInstance } from '@/lib/axios';
import type { UpdateGoalDTO, KeyResult, GoalLinkedHabit, GoalLinkedTask } from '@horus/shared';

const PRIORITY_CONFIG = {
  alta: { label: 'Alta', className: 'bg-red-100 text-red-700' },
  media: { label: 'Media', className: 'bg-yellow-100 text-yellow-700' },
  baja: { label: 'Baja', className: 'bg-green-100 text-green-700' },
};

function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-emerald-500';
  if (progress >= 80) return 'bg-yellow-400';
  return 'bg-blue-500';
}

function getDaysRemaining(targetDate?: string | null): string | null {
  if (!targetDate) return null;
  const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Vencida';
  if (days === 0) return 'Vence hoy';
  return `${days} días restantes`;
}

interface HabitOption {
  id: string;
  name: string;
  icon?: string | null;
}
interface TaskOption {
  id: string;
  title: string;
}

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goalId = id!;

  const { data: goal, isLoading } = useGoal(goalId);
  const updateGoal = useUpdateGoal();
  const createKR = useCreateKeyResult(goalId);
  const updateKR = useUpdateKeyResult(goalId);
  const deleteKR = useDeleteKeyResult(goalId);
  const linkHabit = useLinkHabit(goalId);
  const unlinkHabit = useUnlinkHabit(goalId);
  const linkTask = useLinkTask(goalId);
  const unlinkTask = useUnlinkTask(goalId);

  const [editModalOpen, setEditModalOpen] = useState(false);

  // KR form state
  const [newKrTitle, setNewKrTitle] = useState('');
  const [newKrTarget, setNewKrTarget] = useState('');
  const [newKrUnit, setNewKrUnit] = useState('');
  const [showKrForm, setShowKrForm] = useState(false);
  const [editingKrValues, setEditingKrValues] = useState<Record<string, string>>({});

  // Link panels
  const [showHabitPanel, setShowHabitPanel] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [habitOptions, setHabitOptions] = useState<HabitOption[]>([]);
  const [taskOptions, setTaskOptions] = useState<TaskOption[]>([]);

  const loadHabits = async () => {
    if (habitOptions.length > 0) {
      setShowHabitPanel(true);
      return;
    }
    const r = await axiosInstance.get<{ habits: HabitOption[] }>('/habits');
    setHabitOptions(r.data.habits ?? []);
    setShowHabitPanel(true);
  };

  const loadTasks = async () => {
    if (taskOptions.length > 0) {
      setShowTaskPanel(true);
      return;
    }
    const r = await axiosInstance.get<{ tasks: TaskOption[] }>('/tasks');
    setTaskOptions(r.data.tasks ?? []);
    setShowTaskPanel(true);
  };

  const handleUpdateGoal = async (data: UpdateGoalDTO) => {
    await updateGoal.mutateAsync({ id: goalId, data });
    setEditModalOpen(false);
  };

  const handleToggleStatus = async () => {
    if (!goal) return;
    const newStatus = goal.status === 'en_progreso' ? 'completada' : 'en_progreso';
    await updateGoal.mutateAsync({ id: goalId, data: { status: newStatus } });
  };

  const handleCreateKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKrTitle.trim() || !newKrTarget) return;
    await createKR.mutateAsync({
      title: newKrTitle.trim(),
      targetValue: Number(newKrTarget),
      unit: newKrUnit.trim() || undefined,
    });
    setNewKrTitle('');
    setNewKrTarget('');
    setNewKrUnit('');
    setShowKrForm(false);
  };

  const handleUpdateKRValue = async (kr: KeyResult, newValue: string) => {
    const val = parseFloat(newValue);
    if (isNaN(val) || val < 0) return;
    await updateKR.mutateAsync({ krId: kr.id, data: { currentValue: val } });
    setEditingKrValues((prev) => {
      const n = { ...prev };
      delete n[kr.id];
      return n;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="p-6 text-center text-gray-500">
        Meta no encontrada.{' '}
        <button onClick={() => navigate('/goals')} className="text-indigo-600 hover:underline">
          Volver a metas
        </button>
      </div>
    );
  }

  const priorityConfig = PRIORITY_CONFIG[goal.priority];
  const progressColor = getProgressColor(goal.progress);
  const daysRemaining = getDaysRemaining(goal.targetDate);
  const linkedHabitIds = new Set((goal.goalHabits ?? []).map((gh) => gh.habitId));
  const linkedTaskIds = new Set((goal.goalTasks ?? []).map((gt) => gt.taskId));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Toaster position="top-right" />

      {/* Back */}
      <button
        onClick={() => navigate('/goals')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a metas
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {goal.category?.icon && <span className="text-2xl">{goal.category.icon}</span>}
              <h1 className="text-xl font-bold text-gray-900">{goal.title}</h1>
            </div>
            {goal.description && <p className="text-sm text-gray-500 mb-3">{goal.description}</p>}
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig.className}`}
              >
                {priorityConfig.label}
              </span>
              {goal.category?.name && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                  {goal.category.name}
                </span>
              )}
              {daysRemaining && goal.status === 'en_progreso' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${daysRemaining === 'Vencida' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  📅 {daysRemaining}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={updateGoal.isPending}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                goal.status === 'en_progreso'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {goal.status === 'en_progreso' ? 'Marcar completada' : 'Reactivar'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso general</span>
            <span
              className={`text-2xl font-bold ${goal.progress >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}
            >
              {goal.progress}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressColor}`}
              style={{ width: `${Math.min(goal.progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Key Results */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">🎯 Key Results</h2>
          <button
            onClick={() => setShowKrForm((v) => !v)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Agregar KR
          </button>
        </div>

        {showKrForm && (
          <form
            onSubmit={handleCreateKR}
            className="flex flex-col gap-2 mb-4 p-3 bg-indigo-50 rounded-lg"
          >
            <input
              value={newKrTitle}
              onChange={(e) => setNewKrTitle(e.target.value)}
              required
              placeholder="Título del Key Result"
              className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newKrTarget}
                onChange={(e) => setNewKrTarget(e.target.value)}
                required
                min="0.01"
                step="any"
                placeholder="Valor objetivo"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={newKrUnit}
                onChange={(e) => setNewKrUnit(e.target.value)}
                placeholder="Unidad (ej: %)"
                maxLength={50}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowKrForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createKR.isPending}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </form>
        )}

        {(goal.keyResults ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Sin Key Results. Agregá uno para medir tu progreso.
          </p>
        ) : (
          <div className="space-y-3">
            {(goal.keyResults ?? []).map((kr) => {
              const pct =
                kr.targetValue > 0
                  ? Math.min(Math.round((kr.currentValue / kr.targetValue) * 100), 100)
                  : 0;
              const isEditing = kr.id in editingKrValues;
              return (
                <div key={kr.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{kr.title}</span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editingKrValues[kr.id]}
                          onChange={(e) =>
                            setEditingKrValues((prev) => ({ ...prev, [kr.id]: e.target.value }))
                          }
                          onBlur={() => handleUpdateKRValue(kr, editingKrValues[kr.id])}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleUpdateKRValue(kr, editingKrValues[kr.id])
                          }
                          autoFocus
                          className="w-20 px-2 py-0.5 border border-indigo-400 rounded text-sm text-right focus:outline-none"
                          min="0"
                          step="any"
                        />
                      ) : (
                        <button
                          onClick={() =>
                            setEditingKrValues((prev) => ({
                              ...prev,
                              [kr.id]: String(kr.currentValue),
                            }))
                          }
                          className="text-sm text-gray-600 hover:text-indigo-600 tabular-nums"
                          title="Click para editar"
                        >
                          {kr.currentValue}/{kr.targetValue}
                          {kr.unit ? ` ${kr.unit}` : ''}
                        </button>
                      )}
                      <span
                        className={`text-xs font-bold ${pct >= 100 ? 'text-emerald-600' : 'text-gray-500'}`}
                      >
                        {pct}%
                      </span>
                      <button
                        onClick={() => deleteKR.mutate(kr.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Eliminar KR"
                      >
                        <svg
                          className="w-3.5 h-3.5"
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
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Linked Habits */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">🔄 Hábitos vinculados</h2>
          <button
            onClick={loadHabits}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Vincular
          </button>
        </div>

        {showHabitPanel && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Seleccioná un hábito para vincular:
            </p>
            <div className="flex flex-wrap gap-2">
              {habitOptions
                .filter((h) => !linkedHabitIds.has(h.id))
                .map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      linkHabit.mutate(h.id);
                      setShowHabitPanel(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm hover:border-blue-400 hover:text-blue-700 transition-colors"
                  >
                    {h.icon && <span>{h.icon}</span>}
                    {h.name}
                  </button>
                ))}
              {habitOptions.filter((h) => !linkedHabitIds.has(h.id)).length === 0 && (
                <span className="text-xs text-gray-400">Todos los hábitos ya están vinculados</span>
              )}
            </div>
            <button
              onClick={() => setShowHabitPanel(false)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Cerrar
            </button>
          </div>
        )}

        {(goal.goalHabits ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin hábitos vinculados.</p>
        ) : (
          <div className="space-y-2">
            {(goal.goalHabits ?? []).map((gh: GoalLinkedHabit) => (
              <div key={gh.habitId} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  {gh.habit.icon && <span>{gh.habit.icon}</span>}
                  <span className="text-sm text-gray-800">{gh.habit.name}</span>
                  {gh.habit.lastCompletedDate && (
                    <span className="text-xs text-gray-400">
                      Último: {new Date(gh.habit.lastCompletedDate).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => unlinkHabit.mutate(gh.habitId)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Desvincular
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Linked Tasks */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">✅ Tareas vinculadas</h2>
          <button
            onClick={loadTasks}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            + Vincular
          </button>
        </div>

        {showTaskPanel && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Seleccioná una tarea para vincular:
            </p>
            <div className="flex flex-wrap gap-2">
              {taskOptions
                .filter((t) => !linkedTaskIds.has(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      linkTask.mutate(t.id);
                      setShowTaskPanel(false);
                    }}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm hover:border-green-400 hover:text-green-700 transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              {taskOptions.filter((t) => !linkedTaskIds.has(t.id)).length === 0 && (
                <span className="text-xs text-gray-400">Todas las tareas ya están vinculadas</span>
              )}
            </div>
            <button
              onClick={() => setShowTaskPanel(false)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600"
            >
              Cerrar
            </button>
          </div>
        )}

        {(goal.goalTasks ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin tareas vinculadas.</p>
        ) : (
          <div className="space-y-2">
            {(goal.goalTasks ?? []).map((gt: GoalLinkedTask) => {
              const statusColors: Record<string, string> = {
                pendiente: 'bg-gray-100 text-gray-600',
                en_progreso: 'bg-blue-100 text-blue-700',
                completada: 'bg-emerald-100 text-emerald-700',
                cancelada: 'bg-gray-100 text-gray-400',
              };
              return (
                <div key={gt.taskId} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{gt.task.title}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[gt.task.status] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {gt.task.status}
                    </span>
                  </div>
                  <button
                    onClick={() => unlinkTask.mutate(gt.taskId)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Desvincular
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <GoalFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateGoal}
        editingGoal={goal}
        isLoading={updateGoal.isPending}
      />
    </div>
  );
}
