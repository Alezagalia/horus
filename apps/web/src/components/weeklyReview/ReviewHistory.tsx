/**
 * ReviewHistory - Lista colapsable de revisiones pasadas (F-03)
 */

import { useState } from 'react';
import type { WeeklyReview } from '@horus/shared';

interface ReviewHistoryProps {
  reviews: WeeklyReview[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ReviewHistory({ reviews }: ReviewHistoryProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const completed = reviews.filter((r) => r.completedAt);

  if (completed.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>📖</span> Historial
      </h2>
      <div className="space-y-2">
        {completed.map((review) => {
          const isOpen = openId === review.id;
          const snap = review.statsSnapshot;
          return (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenId(isOpen ? null : review.id)}
              >
                <div>
                  <span className="text-sm font-semibold text-gray-800">
                    Semana del {formatDate(review.weekStart)}
                  </span>
                  {snap && (
                    <span className="ml-3 text-xs text-gray-400">
                      {snap.habits.rate}% hábitos · {snap.tasks.completed} tareas
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  {/* Snapshot stats */}
                  {snap && (
                    <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-blue-700">{snap.habits.rate}%</p>
                        <p className="text-xs text-blue-500">Hábitos</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-amber-700">{snap.tasks.completed}</p>
                        <p className="text-xs text-amber-500">Tareas</p>
                      </div>
                      <div
                        className={`rounded-xl p-3 text-center ${snap.finance.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}
                      >
                        <p
                          className={`text-lg font-bold ${snap.finance.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}
                        >
                          {snap.finance.balance >= 0 ? '+' : ''}
                          {snap.finance.balance.toLocaleString('es', { maximumFractionDigits: 0 })}
                        </p>
                        <p
                          className={`text-xs ${snap.finance.balance >= 0 ? 'text-green-500' : 'text-red-400'}`}
                        >
                          Balance
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Answers */}
                  {review.answers.length > 0 && (
                    <div className="space-y-3">
                      {review.answers.map((ans) => (
                        <div key={ans.questionId}>
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            {ans.question?.text ?? 'Pregunta'}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{ans.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Focus goals */}
                  {review.focusGoals.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Metas foco</p>
                      <div className="flex flex-wrap gap-1.5">
                        {review.focusGoals.map((fg) => (
                          <span
                            key={fg.goalId}
                            className="text-xs px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full"
                          >
                            🏆 {fg.goal?.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Focus tasks */}
                  {review.focusTasks.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        Tareas prioritarias
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {review.focusTasks.map((ft) => (
                          <span
                            key={ft.taskId}
                            className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full"
                          >
                            {ft.task?.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
