import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useResources, useDeleteResource, useTogglePin } from '../hooks/useResources';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import { CreateResourceDialog } from '../components/resources/CreateResourceDialog';
import type { ResourceFilters as Filters, Resource } from '@horus/shared';

export function ResourcesPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { data: resources, isLoading } = useResources(filters);
  const deleteMutation = useDeleteResource();
  const togglePinMutation = useTogglePin();

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

      {/* Resources Grid */}
      {!isLoading && resources && resources.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {resources.length} {resources.length === 1 ? 'recurso encontrado' : 'recursos encontrados'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={() => handleEdit(resource)}
                onDelete={() => handleDelete(resource.id)}
                onTogglePin={() => handleTogglePin(resource.id)}
              />
            ))}
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
