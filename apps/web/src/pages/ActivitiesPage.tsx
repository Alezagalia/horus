import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  useActivities,
  useAllActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useToggleActivityRecord,
} from '@/hooks/useActivities';
import { ActivityTimelineItem } from '@/components/activities/ActivityTimelineItem';
import { ActivityFormModal } from '@/components/activities/ActivityFormModal';
import type { Activity } from '@horus/shared';
import type { ActivityFormValues } from '@/schemas/activitySchema';

type Tab = 'today' | 'manage';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function displayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const PERIODICITY_LABELS: Record<string, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
};

const PERIODICITY_COLORS: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  WEEKLY: 'bg-amber-100 text-amber-700',
  MONTHLY: 'bg-violet-100 text-violet-700',
};

function sortActivities(activities: Activity[]): Activity[] {
  const fixed: Activity[] = [];
  const after: Activity[] = [];
  const noTime: Activity[] = [];

  for (const a of activities) {
    if (a.timeMode === 'FIXED' && a.fixedHour != null) fixed.push(a);
    else if (a.timeMode === 'AFTER_ACTIVITY') after.push(a);
    else noTime.push(a);
  }

  fixed.sort((a, b) => {
    const aTime = (a.fixedHour ?? 0) * 60 + (a.fixedMinute ?? 0);
    const bTime = (b.fixedHour ?? 0) * 60 + (b.fixedMinute ?? 0);
    return aTime - bTime;
  });
  noTime.sort((a, b) => a.order - b.order);

  const result: Activity[] = [];
  const afterById = new Map(after.map((a) => [a.afterActivityId, a]));

  const insertWithChain = (act: Activity) => {
    result.push(act);
    const next = afterById.get(act.id);
    if (next) insertWithChain(next);
  };

  for (const a of fixed) insertWithChain(a);
  for (const a of noTime) insertWithChain(a);
  for (const a of after) {
    if (!result.includes(a)) result.push(a);
  }

  return result;
}

export function ActivitiesPage() {
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(formatDate(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Activity | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: todayActivities, isLoading: loadingToday } = useActivities(date);
  const { data: allActivities, isLoading: loadingAll } = useAllActivities();

  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const toggleRecord = useToggleActivityRecord();

  const handlePrevDay = () => {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    setDate(formatDate(d));
  };

  const handleNextDay = () => {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    setDate(formatDate(d));
  };

  const handleSubmit = (data: ActivityFormValues) => {
    if (editTarget) {
      updateActivity.mutate(
        { id: editTarget.id, data },
        {
          onSuccess: () => {
            setModalOpen(false);
            setEditTarget(undefined);
          },
        }
      );
    } else {
      createActivity.mutate(data, { onSuccess: () => setModalOpen(false) });
    }
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteActivity.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  };

  const handleToggle = (activityId: string, completed: boolean, notes?: string) => {
    toggleRecord.mutate({ activityId, data: { date, completed, notes: notes ?? null } });
  };

  const sorted = sortActivities(todayActivities ?? []);
  const active = sorted.filter(
    (a) =>
      !(
        a.periodicity === 'MONTHLY' &&
        a.timesPerMonth != null &&
        (a.monthlyCompletions ?? 0) >= a.timesPerMonth &&
        !a.record?.completed
      )
  );
  const monthlyFull = sorted.filter(
    (a) =>
      a.periodicity === 'MONTHLY' &&
      a.timesPerMonth != null &&
      (a.monthlyCompletions ?? 0) >= a.timesPerMonth &&
      !a.record?.completed
  );

  const deletingActivity = allActivities?.find((a) => a.id === deletingId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚡ Actividades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Rutina diaria estructurada con seguimiento por día
          </p>
        </div>
        <button
          onClick={() => {
            setEditTarget(undefined);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm shadow-indigo-500/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva actividad
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['today', 'manage'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'today' ? 'Hoy' : 'Gestionar'}
          </button>
        ))}
      </div>

      {/* ── TAB: HOY ── */}
      {tab === 'today' && (
        <div>
          {/* Date navigation */}
          <div className="glass-card flex items-center justify-between p-3 mb-4">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {displayDate(date)}
            </span>
            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              ›
            </button>
          </div>

          {loadingToday ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin actividades para hoy</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Creá tu primera actividad y aparecerá aquí en el orden que configures.
              </p>
              <button
                onClick={() => {
                  setTab('manage');
                  setEditTarget(undefined);
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Crear primera actividad
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((a) => (
                <ActivityTimelineItem
                  key={a.id}
                  activity={a}
                  onToggle={handleToggle}
                  isToggling={toggleRecord.isPending}
                />
              ))}
              {monthlyFull.length > 0 && (
                <>
                  <p className="text-xs text-gray-400 pt-3 pb-1 font-medium uppercase tracking-wide">
                    Completadas este mes
                  </p>
                  {monthlyFull.map((a) => (
                    <ActivityTimelineItem
                      key={a.id}
                      activity={a}
                      onToggle={handleToggle}
                      isToggling={toggleRecord.isPending}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: GESTIONAR ── */}
      {tab === 'manage' && (
        <div>
          {loadingAll ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !allActivities || allActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin actividades</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Definí actividades de rutina diaria, semanal o mensual para estructurar tu día.
              </p>
              <button
                onClick={() => {
                  setEditTarget(undefined);
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Crear primera actividad
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {allActivities.map((a) => (
                <div key={a.id} className="glass-card flex items-center gap-3 p-3">
                  {a.emoji && <span className="text-xl flex-shrink-0">{a.emoji}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                    {a.description && (
                      <p className="text-xs text-gray-400 truncate">{a.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PERIODICITY_COLORS[a.periodicity]}`}
                  >
                    {PERIODICITY_LABELS[a.periodicity]}
                  </span>
                  <button
                    onClick={() => {
                      setEditTarget(a);
                      setModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingId(a.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <ActivityFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(undefined);
        }}
        onSubmit={handleSubmit}
        initial={editTarget}
        isLoading={createActivity.isPending || updateActivity.isPending}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar actividad</h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Eliminar <strong>"{deletingActivity?.name}"</strong>? Esta acción no se puede
                deshacer.
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
                  disabled={deleteActivity.isPending}
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
