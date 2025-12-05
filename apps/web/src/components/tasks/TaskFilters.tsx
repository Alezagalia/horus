/**
 * Task Filters Component
 * Sprint 11 - US-101
 * Redesigned: Compact horizontal layout with active filter indicators
 */

import { useMemo } from 'react';
import type { TaskFilterStatus, TaskFilterPriority, TaskSortOption } from '@/types/tasks';
import type { Category } from '@/types/habits';

interface TaskFiltersProps {
  statusFilter: TaskFilterStatus;
  onStatusChange: (status: TaskFilterStatus) => void;
  priorityFilter: TaskFilterPriority;
  onPriorityChange: (priority: TaskFilterPriority) => void;
  categoryFilter: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  sortBy: TaskSortOption;
  onSortChange: (sort: TaskSortOption) => void;
  categories: Category[];
}

const statusLabels: Record<TaskFilterStatus, string> = {
  all: 'Todos los estados',
  pending: 'Pendientes',
  in_progress: 'En Progreso',
  completed: 'Completadas',
};

const priorityLabels: Record<TaskFilterPriority, string> = {
  all: 'Todas las prioridades',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const priorityColors: Record<TaskFilterPriority, string> = {
  all: '',
  alta: 'text-red-600',
  media: 'text-yellow-600',
  baja: 'text-green-600',
};

const priorityDots: Record<TaskFilterPriority, string> = {
  all: '',
  alta: 'bg-red-500',
  media: 'bg-yellow-500',
  baja: 'bg-green-500',
};

const sortLabels: Record<TaskSortOption, string> = {
  dueDate: 'Fecha vencimiento',
  priority: 'Prioridad',
  createdAt: 'Fecha creación',
};

export function TaskFilters({
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
}: TaskFiltersProps) {
  // Count active filters (excluding 'all' values and default sort)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (categoryFilter) count++;
    return count;
  }, [statusFilter, priorityFilter, categoryFilter]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleClearFilters = () => {
    onStatusChange('all');
    onPriorityChange('all');
    onCategoryChange(null);
  };

  const selectedCategory = categories.find((c) => c.id === categoryFilter);

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as TaskFilterStatus)}
            className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              statusFilter !== 'all'
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as TaskFilterPriority)}
            className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              priorityFilter !== 'all'
                ? 'border-indigo-300 bg-indigo-50 font-medium ' + priorityColors[priorityFilter]
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {value !== 'all' ? `● ${label}` : label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {/* Color indicator dot */}
          {priorityFilter !== 'all' && (
            <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${priorityDots[priorityFilter]}`} />
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className={`appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              categoryFilter
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 hidden sm:block" />

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as TaskSortOption)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {/* Sort icon */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Active filters indicator and clear button */}
        {hasActiveFilters && (
          <>
            <div className="h-6 w-px bg-gray-300 hidden sm:block" />

            {/* Active filters badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
              </span>

              {/* Clear filters button */}
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Limpiar filtros"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
