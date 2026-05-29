/**
 * MealPlanGrid - grid 7x5 del planificador semanal
 * F-17 Sprint 2
 */

import { useState } from 'react';
import type { MealPlanWithEntries, MealTime, MealEntry, DayMacros } from '@horus/shared';
import { MealEntrySlot } from './MealEntrySlot';
import { AddMealEntryModal } from './AddMealEntryModal';

const MEAL_TIMES: MealTime[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

const MEAL_TIME_LABELS: Record<MealTime, string> = {
  BREAKFAST: 'Desayuno',
  MORNING_SNACK: 'M. Mañana',
  LUNCH: 'Almuerzo',
  AFTERNOON_SNACK: 'Merienda',
  DINNER: 'Cena',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  const start = new Date(weekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

interface MealPlanGridProps {
  mealPlan: MealPlanWithEntries;
  dayMacros?: DayMacros[];
  onViewRecipe?: (recipeId: string) => void;
}

export function MealPlanGrid({ mealPlan, dayMacros = [], onViewRecipe }: MealPlanGridProps) {
  const [modal, setModal] = useState<{ day: string; mealTime: MealTime } | null>(null);

  const weekDays = getWeekDays(mealPlan.weekStart);
  const today = new Date().toISOString().split('T')[0];

  // Map day → macros for O(1) lookup
  const macrosByDay = new Map<string, DayMacros>(dayMacros.map((dm) => [dm.day, dm]));

  const entriesByDayAndMealTime = new Map<string, Map<MealTime, MealEntry[]>>();
  for (const entry of mealPlan.entries) {
    const key = entry.day;
    if (!entriesByDayAndMealTime.has(key)) {
      entriesByDayAndMealTime.set(key, new Map());
    }
    const dayMap = entriesByDayAndMealTime.get(key)!;
    const mt = entry.mealTime as MealTime;
    if (!dayMap.has(mt)) dayMap.set(mt, []);
    dayMap.get(mt)!.push(entry);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full border-collapse min-w-[800px] bg-white">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="w-24 px-3 py-3 text-xs font-semibold text-gray-400 text-left border-b border-gray-100">
                Comida
              </th>
              {weekDays.map((day, i) => {
                const date = new Date(day + 'T12:00:00');
                const isToday = day === today;
                const dm = macrosByDay.get(day);
                const kcal = dm ? Math.round(dm.macros.calories) : null;
                const protein = dm?.macros.protein ?? 0;
                const carbs = dm?.macros.carbs ?? 0;
                const fat = dm?.macros.fat ?? 0;

                return (
                  <th
                    key={day}
                    className={`px-2 py-3 text-center min-w-[110px] border-b border-gray-100 ${
                      isToday ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {/* Día + número */}
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-600'}`}
                        >
                          {DAY_NAMES[i]}
                        </span>
                        <span
                          className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isToday ? 'bg-indigo-600 text-white' : 'text-gray-400'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Kcal */}
                      {kcal !== null && (
                        <span className="text-[11px] font-semibold text-orange-500">
                          {kcal} kcal
                        </span>
                      )}

                      {/* Macro bars */}
                      {dm && (
                        <div className="w-full px-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-blue-400 w-10 shrink-0">Prot.</span>
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${Math.min(100, (protein / 200) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-yellow-500 w-10 shrink-0">Carbs.</span>
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${Math.min(100, (carbs / 300) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-red-400 w-10 shrink-0">Grasas</span>
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-400 rounded-full"
                                style={{ width: `${Math.min(100, (fat / 100) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_TIMES.map((mealTime, rowIdx) => (
              <tr
                key={mealTime}
                className={`border-t border-gray-100 ${rowIdx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
              >
                <td className="px-3 py-2 text-xs font-medium text-gray-500 align-top whitespace-nowrap">
                  {MEAL_TIME_LABELS[mealTime]}
                </td>
                {weekDays.map((day) => {
                  const isToday = day === today;
                  const entries = entriesByDayAndMealTime.get(day)?.get(mealTime) ?? [];
                  return (
                    <td key={day} className={`p-1.5 align-top ${isToday ? 'bg-indigo-50/30' : ''}`}>
                      <MealEntrySlot
                        mealPlanId={mealPlan.id}
                        day={day}
                        mealTime={mealTime}
                        entries={entries}
                        onAdd={() => setModal({ day, mealTime })}
                        onViewRecipe={onViewRecipe}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <AddMealEntryModal
          open
          onClose={() => setModal(null)}
          mealPlanId={mealPlan.id}
          day={modal.day}
          mealTime={modal.mealTime}
        />
      )}
    </>
  );
}
