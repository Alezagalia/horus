import { useState, useEffect } from 'react';
import { ResourceType, CreateResourceDto, Resource } from '@horus/shared';
import { X, Save } from 'lucide-react';
import { ResourceTypeSelector } from './ResourceTypeSelector';
import { NoteEditor } from './NoteEditor';
import { SnippetEditor } from './SnippetEditor';
import { BookmarkForm } from './BookmarkForm';
import { useCreateResource, useUpdateResource } from '../../hooks/useResources';

interface CreateResourceDialogProps {
  open: boolean;
  onClose: () => void;
  resource?: Resource | null;
}

export function CreateResourceDialog({ open, onClose, resource }: CreateResourceDialogProps) {
  const [type, setType] = useState<ResourceType>(ResourceType.NOTE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState('');

  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();

  // Reset form when dialog opens/closes or when resource changes
  useEffect(() => {
    if (resource) {
      setType(resource.type);
      setTitle(resource.title);
      setDescription(resource.description || '');
      setContent(resource.content || '');
      setUrl(resource.url || '');
      setLanguage(resource.language || 'javascript');
      setTags(resource.tags || []);
      setColor(resource.color || '');
    } else {
      setType(ResourceType.NOTE);
      setTitle('');
      setDescription('');
      setContent('');
      setUrl('');
      setLanguage('javascript');
      setTags([]);
      setTagInput('');
      setColor('');
    }
  }, [resource, open]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateResourceDto = {
      type,
      title,
      description: description || undefined,
      tags,
      color: color || undefined,
    };

    if (type === ResourceType.NOTE || type === ResourceType.SNIPPET) {
      data.content = content;
    }

    if (type === ResourceType.SNIPPET) {
      data.language = language;
    }

    if (type === ResourceType.BOOKMARK) {
      data.url = url;
    }

    try {
      if (resource) {
        await updateMutation.mutateAsync({ id: resource.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  if (!open) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              {resource ? 'Editar Resource' : 'Nuevo Resource'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Type Selector */}
            {!resource && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de recurso
                </label>
                <ResourceTypeSelector selected={type} onSelect={setType} />
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={300}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Título descriptivo..."
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descripción breve (opcional)..."
              />
            </div>

            {/* Content based on type */}
            {type === ResourceType.NOTE && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido *
                </label>
                <NoteEditor value={content} onChange={setContent} />
              </div>
            )}

            {type === ResourceType.SNIPPET && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código *
                </label>
                <SnippetEditor
                  code={content}
                  language={language}
                  onCodeChange={setContent}
                  onLanguageChange={setLanguage}
                />
              </div>
            )}

            {type === ResourceType.BOOKMARK && (
              <div>
                <BookmarkForm url={url} onUrlChange={setUrl} />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agregar tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Agregar
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color (opcional)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  id="color"
                  type="color"
                  value={color || '#3B82F6'}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                {color && (
                  <button
                    type="button"
                    onClick={() => setColor('')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Quitar color
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !title || (type !== ResourceType.BOOKMARK && !content) || (type === ResourceType.BOOKMARK && !url)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Guardando...' : resource ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
