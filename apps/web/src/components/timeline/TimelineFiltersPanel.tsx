/**
 * Timeline Filters Panel
 * F-16 - Arqueología Personal
 * Sprint 16 - US-153
 */

import {
  TIMELINE_CATEGORIES,
  TIMELINE_MODULES,
  type TimelineEventCategory,
  type TimelineModule,
} from '@horus/shared';

interface TimelineFiltersPanelProps {
  modules: Set<TimelineModule>;
  categories: Set<TimelineEventCategory>;
  onModulesChange: (next: Set<TimelineModule>) => void;
  onCategoriesChange: (next: Set<TimelineEventCategory>) => void;
}

const MODULE_LABEL: Record<TimelineModule, string> = {
  habits: 'Hábitos',
  tasks: 'Tareas',
  workouts: 'Workouts',
  goals: 'Metas',
  finance: 'Finanzas',
  resources: 'Recursos',
};

const CATEGORY_LABEL: Record<TimelineEventCategory, string> = {
  first: 'Primera vez',
  completed: 'Hitos',
  anniversary: 'Aniversarios',
  milestone: 'Marcas',
};

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function TimelineFiltersPanel({
  modules,
  categories,
  onModulesChange,
  onCategoriesChange,
}: TimelineFiltersPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-xl border border-gray-100 bg-white p-5">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Módulos</h4>
        <div className="grid grid-cols-2 gap-2">
          {TIMELINE_MODULES.map((mod) => (
            <label key={mod} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={modules.has(mod)}
                onChange={() => onModulesChange(toggle(modules, mod))}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>{MODULE_LABEL[mod]}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tipo de evento</h4>
        <div className="grid grid-cols-2 gap-2">
          {TIMELINE_CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={categories.has(cat)}
                onChange={() => onCategoriesChange(toggle(categories, cat))}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>{CATEGORY_LABEL[cat]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
