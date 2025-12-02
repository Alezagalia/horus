/**
 * Category Card Component
 * Sprint 11 - US-102
 */

import type { Category } from '@horus/shared';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onSetDefault: (category: Category) => void;
}

export function CategoryCard({ category, onEdit, onDelete, onSetDefault }: CategoryCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md ${
        category.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50 opacity-70'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Icon + Color */}
        <div className="flex items-center gap-3">
          {/* Emoji Icon */}
          {category.icon && (
            <div className="text-3xl w-12 h-12 flex items-center justify-center">
              {category.icon}
            </div>
          )}

          {/* Color Circle */}
          {category.color && (
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: category.color }}
              title={category.color}
            />
          )}
        </div>

        {/* Name + Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold text-gray-900 ${!category.isActive ? 'line-through text-gray-500' : ''}`}
            >
              {category.name}
            </h3>

            {/* Default Badge */}
            {category.isDefault && (
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                Predeterminada
              </span>
            )}

            {/* Inactive Badge */}
            {!category.isActive && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                Inactiva
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Set Default Button */}
          {category.isActive && !category.isDefault && (
            <button
              onClick={() => onSetDefault(category)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Marcar como predeterminada"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          )}

          {/* Edit Button */}
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Editar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
