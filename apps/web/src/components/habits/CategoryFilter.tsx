/**
 * Category Filter Component
 * Sprint 11 - US-099
 */

import type { Category } from '@/types/habits';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedCategoryId === null
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            selectedCategoryId === category.id
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{
            backgroundColor:
              selectedCategoryId === category.id ? category.color || '#4F46E5' : undefined,
          }}
        >
          {category.icon && <span>{category.icon}</span>}
          {category.name}
        </button>
      ))}
    </div>
  );
}
