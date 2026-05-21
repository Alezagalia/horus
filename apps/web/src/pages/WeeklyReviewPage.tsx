/**
 * WeeklyReviewPage - F-03 Revisión Semanal / Check-in
 */

import { useState, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import {
  useWeeklyStats,
  useCurrentReview,
  useReviewHistory,
  useUpdateReview,
  useReviewQuestions,
} from '@/hooks/useWeeklyReview';
import { WeekStats } from '@/components/weeklyReview/WeekStats';
import { ReflectionSection } from '@/components/weeklyReview/ReflectionSection';
import { NextWeekPlanner } from '@/components/weeklyReview/NextWeekPlanner';
import { ReviewHistory } from '@/components/weeklyReview/ReviewHistory';
import type { WeeklyReviewFocusGoal, WeeklyReviewFocusTask } from '@horus/shared';
import toast from 'react-hot-toast';

// ─── Local types ──────────────────────────────────────────────────────────────

interface MergedAnswer {
  questionId: string;
  question: { id: string; text: string; order: number };
  answer: string;
}

// ─── Week navigation helpers ──────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('es', opts)} – ${sunday.toLocaleDateString('es', opts)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WeeklyReviewPage() {
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOf(new Date()));
  const weekStart = currentMonday.toISOString();

  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [localGoalIds, setLocalGoalIds] = useState<string[] | null>(null);
  const [localTaskIds, setLocalTaskIds] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const { data: stats, isLoading: statsLoading } = useWeeklyStats(weekStart);
  const { data: review, isLoading: reviewLoading } = useCurrentReview(weekStart);
  const { data: history } = useReviewHistory();
  const { data: questions = [] } = useReviewQuestions();
  const { data: goalsResponse } = useGoals('en_progreso');
  const { data: tasksRaw } = useTasks({ status: 'pending' });
  const updateReview = useUpdateReview(weekStart);

  // Goals available to select (en progreso)
  const activeGoals = (goalsResponse?.goals ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    status: g.status,
    priority: g.priority ?? null,
    progress: g.progress ?? 0,
  }));

  const pendingTasks = (tasksRaw ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as string,
    priority: null as string | null,
  }));

  // Build merged answers
  const mergedAnswers: MergedAnswer[] = [];
  const serverAnswerMap = new Map<string, string>(
    (review?.answers ?? []).map((a) => [a.questionId, a.answer])
  );
  for (const q of questions) {
    mergedAnswers.push({
      questionId: q.id,
      question: { id: q.id, text: q.text, order: q.order },
      answer: localAnswers[q.id] ?? serverAnswerMap.get(q.id) ?? '',
    });
  }

  // Derive current focus selections (local override or server data)
  const focusGoals: WeeklyReviewFocusGoal[] =
    localGoalIds !== null
      ? localGoalIds.map((id) => {
          const g = activeGoals.find((x) => x.id === id);
          return { goalId: id, goal: g ?? { id, title: id, status: 'en_progreso' } };
        })
      : (review?.focusGoals ?? []);

  const focusTasks: WeeklyReviewFocusTask[] =
    localTaskIds !== null
      ? localTaskIds.map((id) => {
          const t = pendingTasks.find((x) => x.id === id);
          return { taskId: id, task: t ?? { id, title: id, status: 'pending' } };
        })
      : (review?.focusTasks ?? []);

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleGoalToggle = useCallback(
    (goalId: string) => {
      const current = localGoalIds ?? (review?.focusGoals ?? []).map((fg) => fg.goalId);
      setLocalGoalIds(
        current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId]
      );
    },
    [localGoalIds, review]
  );

  const handleTaskToggle = useCallback(
    (taskId: string) => {
      const current = localTaskIds ?? (review?.focusTasks ?? []).map((ft) => ft.taskId);
      setLocalTaskIds(
        current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
      );
    },
    [localTaskIds, review]
  );

  const buildPayload = () => ({
    answers: mergedAnswers
      .filter((a) => a.answer.trim())
      .map((a) => ({ questionId: a.questionId, answer: a.answer })),
    focusGoalIds: localGoalIds ?? (review?.focusGoals ?? []).map((fg) => fg.goalId),
    focusTaskIds: localTaskIds ?? (review?.focusTasks ?? []).map((ft) => ft.taskId),
  });

  const resetLocal = () => {
    setLocalAnswers({});
    setLocalGoalIds(null);
    setLocalTaskIds(null);
  };

  const handleSave = async () => {
    if (!review) return;
    setIsSaving(true);
    try {
      await updateReview.mutateAsync({ id: review.id, data: buildPayload() });
      resetLocal();
      toast.success('Revisión guardada');
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!review) return;
    setIsCompleting(true);
    try {
      await updateReview.mutateAsync({
        id: review.id,
        data: { ...buildPayload(), completedAt: new Date().toISOString() },
      });
      resetLocal();
      toast.success('¡Revisión completada! 🎉');
    } finally {
      setIsCompleting(false);
    }
  };

  const isCompleted = !!review?.completedAt;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
            <span>📋</span> Revisión Semanal
          </h1>
          <p className="text-sm text-gray-500">
            Cierra el loop: revisa lo que pasó y planifica la próxima semana.
          </p>
        </div>

        {/* Week navigator */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6">
          <button
            onClick={() => setCurrentMonday(addWeeks(currentMonday, -1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            ← Anterior
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">{formatWeekLabel(currentMonday)}</p>
            {isCompleted && (
              <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                ✓ Completada
              </span>
            )}
          </div>
          <button
            onClick={() => setCurrentMonday(addWeeks(currentMonday, 1))}
            disabled={getMondayOf(new Date()).getTime() <= currentMonday.getTime()}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Stats */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Esta semana
            </h2>
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse"
                  />
                ))}
              </div>
            ) : stats ? (
              <WeekStats stats={stats} />
            ) : null}
          </div>

          {/* Right: Action */}
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Reflexión y planificación
            </h2>

            {reviewLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
            ) : (
              <>
                <ReflectionSection
                  questions={questions}
                  answers={mergedAnswers}
                  onAnswerChange={handleAnswerChange}
                />

                <NextWeekPlanner
                  activeGoals={activeGoals}
                  pendingTasks={pendingTasks}
                  focusGoals={focusGoals}
                  focusTasks={focusTasks}
                  onGoalToggle={handleGoalToggle}
                  onTaskToggle={handleTaskToggle}
                />

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isCompleting}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    {isSaving ? 'Guardando…' : 'Guardar borrador'}
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={handleComplete}
                      disabled={isSaving || isCompleting}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm shadow-sm shadow-violet-200"
                    >
                      {isCompleting ? 'Completando…' : '✓ Completar revisión'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* History */}
        {history && <ReviewHistory reviews={history} />}
      </div>
    </div>
  );
}
