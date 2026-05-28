import { useState, useMemo } from 'react';
import { Plus, BookOpen, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { useResources, useDeleteResource, useTogglePin } from '../hooks/useResources';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import { CreateResourceDialog } from '../components/resources/CreateResourceDialog';
import type { ResourceFilters as Filters, Resource } from '@horus/shared';

export function ResourcesPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: resources, isLoading } = useResources(filters);
  const deleteMutation = useDeleteResource();
  const togglePinMutation = useTogglePin();

  const groupedResources = useMemo(() => {
    if (!resources || resources.length === 0) return [];

    const tagMap = new Map<string, Resource[]>();
    const untagged: Resource[] = [];

    for (const resource of resources) {
      if (resource.tags.length === 0) {
        untagged.push(resource);
      } else {
        for (const tag of resource.tags) {
          if (!tagMap.has(tag)) tagMap.set(tag, []);
          tagMap.get(tag)!.push(resource);
        }
      }
    }

    const groups = [...tagMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, items]) => ({ tag, resources: items }));

    if (untagged.length > 0) {
      groups.push({ tag: '', resources: untagged });
    }

    return groups;
  }, [resources]);

  const toggleGroup = (tag: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsCreateOpen(true);
  };

  const handleTogglePin = async (id: string) => {
    await togglePinMutation.mutateAsync(id);
  };

  const handleCloseDialog = () => {
    setIsCreateOpen(false);
    setEditingResource(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Base de Conocimientos</h1>
            <p className="text-gray-600">Notas, código y enlaces organizados</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingResource(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Recurso
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ResourceFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && resources && resources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filters.search || filters.type || filters.isPinned
              ? 'No se encontraron recursos'
              : 'Aún no tienes recursos'}
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.type || filters.isPinned
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primer recurso para comenzar'}
          </p>
          {!filters.search && !filters.type && !filters.isPinned && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Recurso
            </button>
          )}
        </div>
      )}

      {/* Resources grouped by tag */}
      {!isLoading && resources && resources.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {resources.length}{' '}
            {resources.length === 1 ? 'recurso encontrado' : 'recursos encontrados'}
          </div>

          <div className="space-y-6">
            {groupedResources.map(({ tag, resources: items }) => {
              const isCollapsed = collapsedGroups.has(tag);
              const label = tag || 'Sin etiqueta';
              return (
                <section key={tag || '__untagged__'}>
                  <button
                    onClick={() => toggleGroup(tag)}
                    className="flex items-center gap-2 mb-3 group w-full text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Tag className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {tag ? `#${label}` : label}
                    </span>
                    <span className="ml-1 text-xs text-gray-400 font-normal">({items.length})</span>
                    <span className="flex-1 border-t border-gray-200 ml-2" />
                  </button>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((resource) => (
                        <ResourceCard
                          key={`${tag}-${resource.id}`}
                          resource={resource}
                          onEdit={() => handleEdit(resource)}
                          onDelete={() => handleDelete(resource.id)}
                          onTogglePin={() => handleTogglePin(resource.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <CreateResourceDialog
        open={isCreateOpen}
        onClose={handleCloseDialog}
        resource={editingResource}
      />
    </div>
  );
}
