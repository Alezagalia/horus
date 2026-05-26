/**
 * RecipeCard - tarjeta de receta
 * F-17 Sprint 1
 */

import type { RecipeWithIngredients } from '@horus/shared';
import { MacrosBadge } from './MacrosBadge';

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  onEdit?: (recipe: RecipeWithIngredients) => void;
  onDelete?: (recipe: RecipeWithIngredients) => void;
  onSelect?: (recipe: RecipeWithIngredients) => void;
}

export function RecipeCard({ recipe, onEdit, onDelete, onSelect }: RecipeCardProps) {
  return (
    <div
      className={`glass-card p-4 rounded-xl flex flex-col gap-2 ${onSelect ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all' : ''}`}
      onClick={onSelect ? () => onSelect(recipe) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{recipe.name}</p>
          {recipe.description && (
            <p className="text-xs text-gray-500 line-clamp-1">{recipe.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {recipe.ingredients.length} ingredientes · {recipe.servings} porción
            {recipe.servings !== 1 ? 'es' : ''}
          </p>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe);
                }}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Editar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(recipe);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Por porción:</p>
        <MacrosBadge macros={recipe.macrosPerServing} size="sm" />
      </div>
    </div>
  );
}
