/**
 * Task Form Modal Component (Simplified)
 * Sprint 11 - US-101
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Task, TaskFormData } from '@/types/tasks';
import type { Category } from '@horus/shared';
import { taskSchema, type TaskFormSchema } from '@/schemas/taskSchema';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  categories: Category[];
  editingTask?: Task | null;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingTask,
}: TaskFormModalProps) {
  const [checklistItems, setChecklistItems] = useState<{ text: string; completed: boolean }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormSchema>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'media',
      dueDate: '',
      categoryId: '',
      checklist: [],
    },
  });

  useEffect(() => {
    if (!isOpen) return; // Solo resetear cuando el modal se abre

    if (editingTask) {
      // Convertir fecha ISO a formato YYYY-MM-DD para el input date
      let formattedDueDate = '';
      if (editingTask.dueDate) {
        // Extraer la fecha directamente del ISO string para evitar conversiones de timezone
        // El formato ISO es "YYYY-MM-DDTHH:mm:ss.sssZ", tomamos solo la parte de fecha
        formattedDueDate = editingTask.dueDate.split('T')[0];
      }

      reset({
        title: editingTask.title,
        description: editingTask.description || '',
        priority: editingTask.priority,
        dueDate: formattedDueDate,
        categoryId: editingTask.categoryId,
        checklist: editingTask.checklist.map((item) => ({
          text: item.text,
          completed: item.completed,
        })),
      });
      setChecklistItems(
        editingTask.checklist.map((item) => ({ text: item.text, completed: item.completed }))
      );
    } else {
      reset({
        title: '',
        description: '',
        priority: 'media',
        dueDate: '',
        categoryId: '',
        checklist: [],
      });
      setChecklistItems([]);
    }
  }, [isOpen, editingTask, reset]);

  const handleFormSubmit = (data: TaskFormSchema) => {
    // Filtrar checklist items vacíos
    const validChecklist = checklistItems.filter((item) => item.text.trim() !== '');

    const formData: TaskFormData = {
      ...data,
      checklist: validChecklist,
    };
    onSubmit(formData);
    // No cerrar aquí - el padre (TasksPage) lo hará en el onSuccess de la mutación
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { text: '', completed: false }]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, text: string) => {
    const updated = [...checklistItems];
    updated[index].text = text;
    setChecklistItems(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                id="title"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Completar informe mensual"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detalles de la tarea..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Categoría *
                </label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad *
                </label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento
              </label>
              <input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Checklist</label>
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  + Agregar item
                </button>
              </div>
              {checklistItems.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No hay items en el checklist</p>
              ) : (
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Item ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                {editingTask ? 'Guardar cambios' : 'Crear tarea'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
