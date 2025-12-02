/**
 * Category Modal Component (Create/Edit)
 * Sprint 11 - US-102
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { HexColorPicker } from 'react-colorful';
import type { Category, Scope, CreateCategoryDTO } from '@horus/shared';

// Local schema para el formulario
const formSchema = z.object({
  name: z.string().min(1).max(50),
  scope: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryDTO) => void;
  scope: Scope;
  editingCategory?: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  scope,
  editingCategory,
}: CategoryModalProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      scope: scope,
      icon: '',
      color: '#3B82F6',
    },
  });

  useEffect(() => {
    if (editingCategory) {
      reset({
        name: editingCategory.name,
        scope: editingCategory.scope,
        icon: editingCategory.icon || '',
        color: editingCategory.color || '#3B82F6',
      });
      setSelectedEmoji(editingCategory.icon || '');
      setSelectedColor(editingCategory.color || '#3B82F6');
    } else {
      reset({
        name: '',
        scope: scope,
        icon: '',
        color: '#3B82F6',
      });
      setSelectedEmoji('');
      setSelectedColor('#3B82F6');
    }
  }, [editingCategory, reset, scope]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    setValue('icon', emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data as CreateCategoryDTO);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                id="name"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Trabajo"
                maxLength={50}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icono *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left flex items-center gap-2"
                >
                  {selectedEmoji ? (
                    <>
                      <span className="text-2xl">{selectedEmoji}</span>
                      <span className="text-gray-600">Cambiar emoji</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Seleccionar emoji</span>
                  )}
                </button>

                {showEmojiPicker && (
                  <div className="absolute z-10 mt-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="absolute -top-2 -right-2 z-20 bg-white rounded-full p-1 shadow-lg border border-gray-300 hover:bg-gray-100"
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
                      <EmojiPicker onEmojiClick={handleEmojiClick} width={350} height={400} />
                    </div>
                  </div>
                )}
              </div>
              {errors.icon && <p className="mt-1 text-sm text-red-600">{errors.icon.message}</p>}
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-16 h-10 rounded-lg border-2 border-gray-300 relative"
                  style={{ backgroundColor: selectedColor }}
                  title={selectedColor}
                />
                <span className="text-sm text-gray-600 font-mono">{selectedColor}</span>
              </div>

              {showColorPicker && (
                <div className="mt-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(false)}
                      className="absolute -top-2 -right-2 z-20 bg-white rounded-full p-1 shadow-lg border border-gray-300 hover:bg-gray-100"
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
                    <HexColorPicker color={selectedColor} onChange={handleColorChange} />
                  </div>
                </div>
              )}
              {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>}
            </div>

            {/* Scope (readonly if editing) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ámbito</label>
              <input
                type="text"
                value={
                  scope === 'habitos'
                    ? 'Hábitos'
                    : scope === 'tareas'
                      ? 'Tareas'
                      : scope === 'eventos'
                        ? 'Eventos'
                        : 'Gastos'
                }
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
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
                {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
