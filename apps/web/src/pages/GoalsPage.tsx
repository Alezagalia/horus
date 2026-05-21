/**
 * GoalsPage
 * F-02 - Metas y Objetivos (Goals + OKRs)
 */

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import type { GoalWithProgress, CreateGoalDTO, UpdateGoalDTO } from '@horus/shared';

type StatusFilter = 'en_progreso' | 'completada' | 'all';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'en_progreso', label: 'En progreso' },
  { key: 'completada', label: 'Completadas' },
  { key: 'all', label: 'Todas' },
];

export function GoalsPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('en_progreso');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<GoalWithProgress | null>(null);

  const { data, isLoading } = useGoals(activeTab === 'all' ? undefined : activeTab);
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const goals = data?.goals ?? [];

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleEdit = (goal: GoalWithProgress) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleSubmit = async (data: CreateGoalDTO | UpdateGoalDTO) => {
    if (editingGoal) {
      await updateMutation.mutateAsync({ id: editingGoal.id, data: data as UpdateGoalDTO });
    } else {
      await createMutation.mutateAsync(data as CreateGoalDTO);
    }
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deletingGoal) return;
    await deleteMutation.mutateAsync(deletingGoal.id);
    setDeletingGoal(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Metas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tus objetivos con seguimiento automático de progreso
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva meta
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin metas</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Definí tus objetivos con Key Results y vincinalos a hábitos y tareas para seguir tu
            progreso.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Crear primera meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={handleEdit} onDelete={setDeletingGoal} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <GoalFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editingGoal={editingGoal}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      {deletingGoal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeletingGoal(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar meta</h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Eliminar <strong>"{deletingGoal.title}"</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingGoal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
