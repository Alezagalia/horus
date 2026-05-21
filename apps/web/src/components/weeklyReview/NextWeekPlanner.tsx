/**
 * NextWeekPlanner - Selección de metas foco y tareas prioritarias (F-03)
 */

import type { WeeklyReviewFocusGoal, WeeklyReviewFocusTask } from '@horus/shared';

interface ActiveGoal {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  progress: number;
}

interface PendingTask {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
}

interface NextWeekPlannerProps {
  activeGoals: ActiveGoal[];
  pendingTasks: PendingTask[];
  focusGoals: WeeklyReviewFocusGoal[];
  focusTasks: WeeklyReviewFocusTask[];
  onGoalToggle: (goalId: string) => void;
  onTaskToggle: (taskId: string) => void;
}

const priorityBadge: Record<string, string> = {
  alta: 'bg-red-50 text-red-600 border-red-200',
  media: 'bg-amber-50 text-amber-600 border-amber-200',
  baja: 'bg-gray-50 text-gray-500 border-gray-200',
};

export function NextWeekPlanner({
  activeGoals,
  pendingTasks,
  focusGoals,
  focusTasks,
  onGoalToggle,
  onTaskToggle,
}: NextWeekPlannerProps) {
  const selectedGoalIds = new Set(focusGoals.map((fg) => fg.goalId));
  const selectedTaskIds = new Set(focusTasks.map((ft) => ft.taskId));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-lg">🚀</span>
        Próxima semana
      </h3>

      {/* Metas foco */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          ¿En qué metas te enfocas?
        </p>
        {activeGoals.length === 0 ? (
          <p className="text-xs text-gray-400">No tienes metas activas.</p>
        ) : (
          <div className="space-y-2">
            {activeGoals.map((g) => {
              const selected = selectedGoalIds.has(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => onGoalToggle(g.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                    selected
                      ? 'bg-violet-500 border-violet-500 text-white shadow-sm shadow-violet-200'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-200'
                  }`}
                >
                  {/* Progress circle */}
                  <div className="relative w-8 h-8 shrink-0">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        fill="none"
                        strokeWidth="3"
                        stroke={selected ? 'rgba(255,255,255,0.3)' : '#E5E7EB'}
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        fill="none"
                        strokeWidth="3"
                        stroke={selected ? 'white' : '#7C3AED'}
                        strokeDasharray={`${(g.progress / 100) * 75.4} 75.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${
                        selected ? 'text-white' : 'text-violet-700'
                      }`}
                    >
                      {g.progress}%
                    </span>
                  </div>

                  <span className="flex-1 text-sm font-medium leading-snug">{g.title}</span>

                  {g.priority && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                        selected
                          ? 'bg-white/20 text-white border-white/30'
                          : (priorityBadge[g.priority] ?? priorityBadge.baja)
                      }`}
                    >
                      {g.priority}
                    </span>
                  )}

                  {selected && <span className="text-white shrink-0">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tareas prioritarias */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tareas concretas
        </p>
        {pendingTasks.length === 0 ? (
          <p className="text-xs text-gray-400">No hay tareas pendientes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingTasks.map((t) => {
              const selected = selectedTaskIds.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onTaskToggle(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    selected
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200'
                      : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  {t.title.length > 32 ? t.title.slice(0, 32) + '…' : t.title}
                  {selected && <span className="ml-0.5">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
