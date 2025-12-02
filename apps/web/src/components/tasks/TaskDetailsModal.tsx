/**
 * Task Details Modal Component
 * Sprint 11 - US-101
 */

import type { Task } from '@/types/tasks';
import { ChecklistItem } from './ChecklistItem';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleChecklistItem: (itemId: string, currentCompleted: boolean) => void;
}

const priorityColors = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baja: 'bg-green-100 text-green-700',
};

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleChecklistItem,
}: TaskDetailsModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}`}
                  >
                    Prioridad:{' '}
                    {task.priority === 'alta'
                      ? 'Alta'
                      : task.priority === 'media'
                        ? 'Media'
                        : 'Baja'}
                  </span>
                  {task.completedAt && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      Completada
                    </span>
                  )}
                  {task.categoryIcon && (
                    <span className="text-sm text-gray-600">
                      {task.categoryIcon} {task.categoryName}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Descripcion</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Fecha de vencimiento</h3>
                <p className="text-gray-600">
                  {(() => {
                    // Extraer componentes de fecha directamente del ISO string para evitar timezone issues
                    const [datePart] = task.dueDate.split('T');
                    const [year, month, day] = datePart.split('-').map(Number);
                    // Crear fecha usando UTC para evitar conversiones de timezone
                    const date = new Date(Date.UTC(year, month - 1, day));
                    return date.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    });
                  })()}
                </p>
              </div>
            )}

            {/* Checklist - Usando componente separado */}
            {task.checklist.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Checklist ({task.checklist.filter((i) => i.completed).length}/
                  {task.checklist.length})
                </h3>
                <div className="space-y-2">
                  {task.checklist.map((item) => (
                    <ChecklistItem
                      key={item.id}
                      id={item.id}
                      text={item.text}
                      initialCompleted={item.completed}
                      onToggle={onToggleChecklistItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Creada: {new Date(task.createdAt).toLocaleDateString('es-ES')}</p>
              {task.completedAt && (
                <p>Completada: {new Date(task.completedAt).toLocaleDateString('es-ES')}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-between">
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              Eliminar tarea
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
