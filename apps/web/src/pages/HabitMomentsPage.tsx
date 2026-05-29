/**
 * HabitMomentsPage — Configuración de momentos del día para hábitos
 * Permite crear, editar y eliminar momentos con rango horario.
 */

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  useHabitMoments,
  useCreateHabitMoment,
  useUpdateHabitMoment,
  useDeleteHabitMoment,
} from '@/hooks/useHabitMoments';
import type {
  HabitMoment,
  CreateHabitMomentDTO,
  UpdateHabitMomentDTO,
} from '@/services/api/habitMomentApi';

// ── helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function timeLabel(hour: number, minute: number) {
  return `${pad(hour)}:${pad(minute)}`;
}

// ── Modal ────────────────────────────────────────────────────────────────────

interface MomentFormValues {
  key: string;
  label: string;
  emoji: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  sortOrder: number;
}

const emptyForm: MomentFormValues = {
  key: '',
  label: '',
  emoji: '⏰',
  startHour: 8,
  startMinute: 0,
  endHour: 10,
  endMinute: 0,
  sortOrder: 0,
};

function MomentModal({
  initial,
  isEdit,
  onSubmit,
  onClose,
  isLoading,
}: {
  initial: MomentFormValues;
  isEdit: boolean;
  onSubmit: (v: MomentFormValues) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<MomentFormValues>(initial);

  const set = <K extends keyof MomentFormValues>(k: K, v: MomentFormValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {isEdit ? 'Editar momento' : 'Nuevo momento'}
        </h2>

        <div className="space-y-4">
          {/* Key (solo en creación) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Clave interna <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="ej. MI_MOMENTO"
                value={form.key}
                onChange={(e) => set('key', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              />
              <p className="mt-0.5 text-xs text-gray-400">
                Identificador único sin espacios. Se usará para agrupar los hábitos.
              </p>
            </div>
          )}

          {/* Emoji + Etiqueta */}
          <div className="flex gap-3">
            <div className="w-20">
              <label className="block text-xs font-medium text-gray-600 mb-1">Emoji</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={form.emoji}
                onChange={(e) => set('emoji', e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="ej. En ayunas"
                value={form.label}
                onChange={(e) => set('label', e.target.value)}
              />
            </div>
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.startHour}
                  onChange={(e) => set('startHour', Number(e.target.value))}
                />
                <span className="text-gray-400">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.startMinute}
                  onChange={(e) => set('startMinute', Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  max={23}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.endHour}
                  onChange={(e) => set('endHour', Number(e.target.value))}
                />
                <span className="text-gray-400">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={form.endMinute}
                  onChange={(e) => set('endMinute', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Orden */}
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-600 mb-1">Orden</label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={form.sortOrder}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={isLoading || !form.label.trim() || (!isEdit && !form.key.trim())}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function HabitMomentsPage() {
  const { data: moments = [], isLoading } = useHabitMoments();
  const createMutation = useCreateHabitMoment();
  const updateMutation = useUpdateHabitMoment();
  const deleteMutation = useDeleteHabitMoment();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HabitMoment | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (m: HabitMoment) => {
    setEditing(m);
    setModalOpen(true);
  };

  const handleSubmit = (v: MomentFormValues) => {
    if (editing) {
      const dto: UpdateHabitMomentDTO = {
        label: v.label,
        emoji: v.emoji,
        startHour: v.startHour,
        startMinute: v.startMinute,
        endHour: v.endHour,
        endMinute: v.endMinute,
        sortOrder: v.sortOrder,
      };
      updateMutation.mutate({ id: editing.id, dto }, { onSuccess: () => setModalOpen(false) });
    } else {
      const dto: CreateHabitMomentDTO = {
        key: v.key,
        label: v.label,
        emoji: v.emoji,
        startHour: v.startHour,
        startMinute: v.startMinute,
        endHour: v.endHour,
        endMinute: v.endMinute,
        sortOrder: v.sortOrder,
      };
      createMutation.mutate(dto, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (m: HabitMoment) => {
    if (!confirm(`¿Eliminar el momento "${m.label}"?`)) return;
    deleteMutation.mutate(m.id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Momentos del día</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Define las franjas horarias que agrupan tus hábitos.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo momento
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : moments.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No hay momentos configurados</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moments.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{m.label}</p>
                    <p className="text-xs text-gray-400 font-mono">{m.key}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.929l-3 1 1-3a4 4 0 01.929-1.414z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {timeLabel(m.startHour, m.startMinute)} – {timeLabel(m.endHour, m.endMinute)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <MomentModal
          isEdit={!!editing}
          initial={
            editing
              ? {
                  key: editing.key,
                  label: editing.label,
                  emoji: editing.emoji,
                  startHour: editing.startHour,
                  startMinute: editing.startMinute,
                  endHour: editing.endHour,
                  endMinute: editing.endMinute,
                  sortOrder: editing.sortOrder,
                }
              : emptyForm
          }
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
