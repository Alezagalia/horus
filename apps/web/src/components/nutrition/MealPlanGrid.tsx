/**
 * MealPlanGrid - grid 7x5 del planificador semanal
 * F-17 Sprint 2
 */

import { useState } from 'react';
import type { MealPlanWithEntries, MealTime, MealEntry } from '@horus/shared';
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
}

export function MealPlanGrid({ mealPlan }: MealPlanGridProps) {
  const [modal, setModal] = useState<{ day: string; mealTime: MealTime } | null>(null);

  const weekDays = getWeekDays(mealPlan.weekStart);

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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="w-24 p-2 text-xs font-semibold text-gray-500 text-left">Comida</th>
              {weekDays.map((day, i) => {
                const date = new Date(day + 'T12:00:00');
                return (
                  <th
                    key={day}
                    className="p-2 text-xs font-semibold text-gray-700 text-center min-w-[120px]"
                  >
                    <div>{DAY_NAMES[i]}</div>
                    <div className="text-gray-400 font-normal">{date.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_TIMES.map((mealTime) => (
              <tr key={mealTime} className="border-t border-gray-100">
                <td className="p-2 text-xs font-medium text-gray-600 align-top whitespace-nowrap">
                  {MEAL_TIME_LABELS[mealTime]}
                </td>
                {weekDays.map((day) => {
                  const entries = entriesByDayAndMealTime.get(day)?.get(mealTime) ?? [];
                  return (
                    <td key={day} className="p-1 align-top">
                      <MealEntrySlot
                        mealPlanId={mealPlan.id}
                        day={day}
                        mealTime={mealTime}
                        entries={entries}
                        onAdd={() => setModal({ day, mealTime })}
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
