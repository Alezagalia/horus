import { ResourceType, ResourceFilters as Filters } from '@horus/shared';
import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';

interface ResourceFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ResourceFilters({ filters, onChange }: ResourceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const { data: knowledgeCategories = [] } = useCategories({ scope: 'knowledge' });

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    setTimeout(() => {
      onChange({ ...filters, search: value || undefined });
    }, 300);
  };

  const handleTypeFilter = (type: ResourceType | undefined) => {
    onChange({ ...filters, type });
  };

  const handlePinnedFilter = () => {
    const newValue = filters.isPinned === true ? undefined : true;
    onChange({ ...filters, isPinned: newValue });
  };

  const clearFilters = () => {
    setSearchInput('');
    onChange({});
  };

  const hasActiveFilters = filters.type || filters.isPinned || filters.search || filters.categoryId;

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar en título, descripción o contenido..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Filter className="w-4 h-4" />
          Filtros:
        </span>

        {/* Type filters */}
        <button
          onClick={() =>
            handleTypeFilter(filters.type === ResourceType.NOTE ? undefined : ResourceType.NOTE)
          }
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            filters.type === ResourceType.NOTE
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          📝 Notas
        </button>

        <button
          onClick={() =>
            handleTypeFilter(
              filters.type === ResourceType.SNIPPET ? undefined : ResourceType.SNIPPET
            )
          }
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            filters.type === ResourceType.SNIPPET
              ? 'bg-green-100 border-green-300 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          📄 Código
        </button>

        <button
          onClick={() =>
            handleTypeFilter(
              filters.type === ResourceType.BOOKMARK ? undefined : ResourceType.BOOKMARK
            )
          }
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            filters.type === ResourceType.BOOKMARK
              ? 'bg-orange-100 border-orange-300 text-orange-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          🔖 Enlaces
        </button>

        {/* Pinned filter */}
        <button
          onClick={handlePinnedFilter}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            filters.isPinned
              ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          ⭐ Favoritos
        </button>

        {/* Category filter */}
        {knowledgeCategories.length > 0 && (
          <select
            value={filters.categoryId ?? ''}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las categorías</option>
            {knowledgeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
