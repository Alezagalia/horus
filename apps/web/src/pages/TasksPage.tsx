/**
 * Tasks Page
 * Sprint 11 - US-101
 * Integrado con backend API
 */

import { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskFormModal } from '@/components/tasks/TaskFormModal';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskComplete,
  useToggleChecklistItem,
} from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { getTaskById } from '@/services/api/taskApi';
import type {
  Task,
  TaskFormData,
  TaskFilterStatus,
  TaskFilterPriority,
  TaskSortOption,
  TaskStatus,
  TaskPriority,
} from '@/types/tasks';

export function TasksPage() {
  // Obtener categorías reales de la API (filtradas por scope tareas)
  const { data: categories = [], isLoading: categoriesLoading } = useCategories({ scope: 'tareas' });

  // State para filtros
  const [statusFilter, setStatusFilter] = useState<TaskFilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskFilterPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<TaskSortOption>('dueDate');

  // State para modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch tasks con filtros de API
  const apiFilters = useMemo(() => {
    const filters: { status?: TaskStatus; priority?: TaskPriority; categoryId?: string } = {};
    if (statusFilter !== 'all') filters.status = statusFilter as TaskStatus;
    if (priorityFilter !== 'all') filters.priority = priorityFilter as TaskPriority;
    if (categoryFilter) filters.categoryId = categoryFilter;
    return filters;
  }, [statusFilter, priorityFilter, categoryFilter]);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks(apiFilters);

  // Mutations
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleCompleteMutation = useToggleTaskComplete();
  const toggleChecklistItemMutation = useToggleChecklistItem();

  // Ordenamiento local (los filtros ya se aplican en la API)
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { alta: 0, media: 1, baja: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    // Completed tasks at the end
    return sorted.sort((a, b) => {
      if (a.completedAt && !b.completedAt) return 1;
      if (!a.completedAt && b.completedAt) return -1;
      return 0;
    });
  }, [tasks, sortBy]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsFormModalOpen(true);
  };

  const handleEditTask = async (taskId: string) => {
    // Obtener la tarea completa con checklist items
    try {
      const fullTask = await getTaskById(taskId);
      console.log('handleEditTask - fullTask:', fullTask);
      console.log('handleEditTask - fullTask.checklist:', fullTask.checklist);
      setEditingTask(fullTask);
      setIsFormModalOpen(true);
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Error fetching task for edit:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
    setIsDetailsModalOpen(false);
  };

  const handleViewDetails = async (taskId: string) => {
    // Obtener la tarea completa con checklist items
    try {
      const fullTask = await getTaskById(taskId);
      setSelectedTask(fullTask);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const handleToggleComplete = (taskId: string) => {
    toggleCompleteMutation.mutate(taskId);
  };

  const handleToggleChecklistItem = (taskId: string, itemId: string, currentCompleted: boolean) => {
    toggleChecklistItemMutation.mutate({ taskId, itemId, currentCompleted });
  };

  const handleSubmitForm = (data: TaskFormData) => {
    if (editingTask) {
      // Editar tarea existente
      updateTaskMutation.mutate(
        { id: editingTask.id, data },
        {
          onSuccess: () => {
            setIsFormModalOpen(false);
            setEditingTask(null);
          },
        }
      );
    } else {
      // Crear nueva tarea
      createTaskMutation.mutate(data, {
        onSuccess: () => {
          setIsFormModalOpen(false);
        },
      });
    }
  };

  const pendingCount = tasks.filter((t) => !t.completedAt).length;
  const completedCount = tasks.filter((t) => t.completedAt).length;

  // Loading state
  if (tasksLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
            <p className="text-gray-600 mt-1">
              {pendingCount} pendientes · {completedCount} completadas
            </p>
          </div>
          <button
            onClick={handleCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TaskFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories}
        />
      </div>

      {/* Tasks List */}
      {sortedTasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay tareas</h2>
            <p className="text-gray-600 mb-4">
              {statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter
                ? 'Intenta ajustar los filtros'
                : 'Crea tu primera tarea para comenzar'}
            </p>
            {statusFilter === 'all' && priorityFilter === 'all' && !categoryFilter && (
              <button
                onClick={handleCreateTask}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Crear tarea
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onViewDetails={handleViewDetails}
              onToggleChecklistItem={handleToggleChecklistItem}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmitForm}
        categories={categories}
        editingTask={editingTask}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={() => selectedTask && handleEditTask(selectedTask.id)}
        onDelete={() => selectedTask && handleDeleteTask(selectedTask.id)}
        onToggleChecklistItem={(itemId, currentCompleted) =>
          selectedTask && handleToggleChecklistItem(selectedTask.id, itemId, currentCompleted)
        }
      />
    </div>
  );
}
