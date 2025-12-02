/**
 * Task Filters Component
 * Sprint 11 - US-101
 */

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
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'in_progress', 'completed'] as TaskFilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && 'Todas'}
              {status === 'pending' && 'Pendientes'}
              {status === 'in_progress' && 'En Progreso'}
              {status === 'completed' && 'Completadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'alta', 'media', 'baja'] as TaskFilterPriority[]).map((priority) => (
            <button
              key={priority}
              onClick={() => onPriorityChange(priority)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                priorityFilter === priority
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority === 'all' && 'Todas'}
              {priority === 'alta' && 'Alta'}
              {priority === 'media' && 'Media'}
              {priority === 'baja' && 'Baja'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
        <select
          value={categoryFilter || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as TaskSortOption)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="dueDate">Fecha de vencimiento</option>
          <option value="priority">Prioridad</option>
          <option value="createdAt">Fecha de creación</option>
        </select>
      </div>
    </div>
  );
}
