/**
 * Tasks Card Component
 * Sprint 11 - US-097
 */

import { useNavigate } from 'react-router-dom';
import { Card } from './Card';
import type { TaskSummary } from '@/types/dashboard';

interface TasksCardProps {
  tasks: TaskSummary[];
}

export function TasksCard({ tasks }: TasksCardProps) {
  const navigate = useNavigate();

  const getPriorityColor = (priority: 'alta' | 'media' | 'baja') => {
    const colors = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-green-100 text-green-800',
    };
    return colors[priority];
  };

  const getPriorityLabel = (priority: 'alta' | 'media' | 'baja') => {
    const labels = {
      alta: 'Alta',
      media: 'Media',
      baja: 'Baja',
    };
    return labels[priority];
  };

  const getRelativeDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Vencida hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays <= 7) return `En ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      title="Tareas Próximas"
      action={{
        label: 'Ver todas',
        onClick: () => navigate('/tasks'),
      }}
    >
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-500 text-sm">No tienes tareas pendientes</p>
          <button
            onClick={() => navigate('/tasks')}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
          >
            Crear tu primera tarea
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <input
                type="checkbox"
                checked={task.completed}
                readOnly
                className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    task.completed ? 'line-through text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                  <span className="text-xs text-gray-500">{getRelativeDate(task.dueDate)}</span>
                </div>
              </div>
            </div>
          ))}
          {tasks.length > 5 && (
            <button
              onClick={() => navigate('/tasks')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Ver {tasks.length - 5} más...
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
