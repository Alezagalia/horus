/**
 * Timeline Page
 * F-16 - Arqueología Personal
 * Sprint 16 - US-153
 */

import { useMemo, useState } from 'react';
import {
  TIMELINE_CATEGORIES,
  TIMELINE_MODULES,
  type TimelineEvent,
  type TimelineEventCategory,
  type TimelineModule,
} from '@horus/shared';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelineEventCard } from '@/components/timeline/TimelineEventCard';
import { TimelineFiltersPanel } from '@/components/timeline/TimelineFiltersPanel';
import { AnniversariesToday } from '@/components/timeline/AnniversariesToday';

function todayISO(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function groupByYear(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const year = event.date.slice(0, 4);
    const arr = groups.get(year);
    if (arr) arr.push(event);
    else groups.set(year, [event]);
  }
  return groups;
}

export function TimelinePage() {
  const [showFilters, setShowFilters] = useState(false);
  const [modules, setModules] = useState<Set<TimelineModule>>(new Set(TIMELINE_MODULES));
  const [categories, setCategories] = useState<Set<TimelineEventCategory>>(
    new Set(TIMELINE_CATEGORIES)
  );

  const today = useMemo(() => todayISO(), []);

  const modulesArray = useMemo(
    () => (modules.size === TIMELINE_MODULES.length ? undefined : Array.from(modules)),
    [modules]
  );
  const categoriesArray = useMemo(
    () => (categories.size === TIMELINE_CATEGORIES.length ? undefined : Array.from(categories)),
    [categories]
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useTimeline({
      modules: modulesArray,
      categories: categoriesArray,
    });

  const allEvents = useMemo(() => (data ? data.pages.flatMap((p) => p.events) : []), [data]);

  const anniversariesToday = useMemo(
    () => allEvents.filter((e) => e.category === 'anniversary' && e.date === today),
    [allEvents, today]
  );

  const restEvents = useMemo(
    () => allEvents.filter((e) => !(e.category === 'anniversary' && e.date === today)),
    [allEvents, today]
  );

  const groupedByYear = useMemo(() => groupByYear(restEvents), [restEvents]);
  const sortedYears = useMemo(
    () => Array.from(groupedByYear.keys()).sort((a, b) => b.localeCompare(a)),
    [groupedByYear]
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Mi Historia</h1>
          <p className="text-sm text-gray-500 mt-1">Línea de tiempo de tus hitos y aniversarios</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>
      </header>

      {showFilters && (
        <TimelineFiltersPanel
          modules={modules}
          categories={categories}
          onModulesChange={setModules}
          onCategoriesChange={setCategories}
        />
      )}

      <AnniversariesToday events={anniversariesToday} />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium mb-2">No se pudo cargar tu historia.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && allEvents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Tu historia recién empieza</h3>
          <p className="text-sm text-gray-500">Volvé pronto y vas a encontrar tus hitos acá.</p>
        </div>
      )}

      {sortedYears.map((year) => (
        <section key={year}>
          <h2 className="text-xl font-bold text-gray-400 mb-3 sticky top-0 bg-white/80 backdrop-blur py-2">
            {year}
          </h2>
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" aria-hidden />
            <ul className="space-y-3">
              {groupedByYear.get(year)?.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[22px] top-6 w-3 h-3 rounded-full bg-white border-2 border-indigo-500"
                    aria-hidden
                  />
                  <TimelineEventCard event={event} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}

      {!hasNextPage && allEvents.length > 0 && (
        <p className="text-center text-xs text-gray-400 pt-4">
          Has llegado al inicio de tu historia.
        </p>
      )}
    </div>
  );
}
