/**
 * Savings Goals Page
 * Metas de Ahorro vinculadas a Cuentas
 */

import { useState } from 'react';
import { PiggyBank, Plus } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import type { SavingsGoalWithProgress } from '@horus/shared';
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
} from '@/hooks/useSavingsGoals';
import { SavingsGoalCard } from '@/components/savingsGoals/SavingsGoalCard';
import { SavingsGoalFormModal } from '@/components/savingsGoals/SavingsGoalFormModal';

type FormData = {
  name: string;
  accountId: string;
  targetAmount: number;
  targetDate?: string;
  notes?: string;
};

export function SavingsGoalsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalWithProgress | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useSavingsGoals();
  const createMutation = useCreateSavingsGoal();
  const updateMutation = useUpdateSavingsGoal();
  const deleteMutation = useDeleteSavingsGoal();

  const goals = data?.savingsGoals ?? [];

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleEdit = (goal: SavingsGoalWithProgress) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => setDeletingId(id);

  const confirmDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const handleSubmit = async (data: FormData) => {
    if (editingGoal) {
      await updateMutation.mutateAsync({
        id: editingGoal.id,
        data: {
          name: data.name,
          targetAmount: data.targetAmount,
          targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null,
          notes: data.notes || null,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: data.name,
        accountId: data.accountId,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : null,
        notes: data.notes || null,
      });
    }
    setModalOpen(false);
    setEditingGoal(null);
  };

  // Separate goals by status
  const active = goals.filter((g) => g.status === 'en_progreso');
  const completed = goals.filter((g) => g.status === 'completada');
  const cancelled = goals.filter((g) => g.status === 'cancelada');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <PiggyBank className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metas de ahorro</h1>
            <p className="text-sm text-gray-500">
              {goals.length} meta{goals.length !== 1 ? 's' : ''} · progreso desde el balance de tu
              cuenta
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Nueva meta
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && goals.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin metas de ahorro</h3>
          <p className="text-sm text-gray-400 mb-4">
            Creá tu primera meta y vinculala a una cuenta para ver el progreso.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Crear meta de ahorro
          </button>
        </div>
      )}

      {/* Active goals */}
      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            En progreso ({active.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((g) => (
              <SavingsGoalCard key={g.id} goal={g} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Completadas ({completed.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">
            {completed.map((g) => (
              <SavingsGoalCard key={g.id} goal={g} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {/* Cancelled goals */}
      {cancelled.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Canceladas ({cancelled.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {cancelled.map((g) => (
              <SavingsGoalCard key={g.id} goal={g} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      )}

      {/* Form modal */}
      <SavingsGoalFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleSubmit}
        editingGoal={editingGoal}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setDeletingId(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar meta de ahorro</h3>
              <p className="text-sm text-gray-500 mb-5">
                ¿Estás seguro/a? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
