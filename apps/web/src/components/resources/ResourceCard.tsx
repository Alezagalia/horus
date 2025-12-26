import { Resource, ResourceType } from '@horus/shared';
import { FileText, Code, Bookmark, Pin, Copy, Trash2, Edit, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Type workaround for React 19 compatibility
const SyntaxHighlighterComponent = SyntaxHighlighter as any;

interface ResourceCardProps {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function ResourceCard({ resource, onEdit, onDelete, onTogglePin }: ResourceCardProps) {
  const getIcon = () => {
    switch (resource.type) {
      case ResourceType.NOTE:
        return <FileText className="w-5 h-5 text-blue-600" />;
      case ResourceType.SNIPPET:
        return <Code className="w-5 h-5 text-green-600" />;
      case ResourceType.BOOKMARK:
        return <Bookmark className="w-5 h-5 text-orange-600" />;
    }
  };

  const handleCopy = () => {
    const textToCopy = resource.content || resource.url || '';
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative"
      style={{
        borderLeftColor: resource.color || undefined,
        borderLeftWidth: resource.color ? '4px' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getIcon()}
          <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
          {resource.isPinned && (
            <Pin className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Copiar"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onTogglePin}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title={resource.isPinned ? 'Desmarcar' : 'Marcar como favorito'}
          >
            <Pin className={`w-4 h-4 ${resource.isPinned ? 'text-yellow-500 fill-current' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Description */}
      {resource.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
      )}

      {/* Content Preview */}
      <div className="mb-3">
        {resource.type === ResourceType.NOTE && resource.content && (
          <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded line-clamp-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resource.content.slice(0, 200)}
            </ReactMarkdown>
          </div>
        )}

        {resource.type === ResourceType.SNIPPET && resource.content && (
          <div className="relative rounded-lg overflow-hidden">
            <SyntaxHighlighterComponent
              language={resource.language || 'text'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                fontSize: '0.75rem',
                maxHeight: '8rem',
              }}
            >
              {resource.content.slice(0, 300)}
            </SyntaxHighlighterComponent>
            {resource.language && (
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                {resource.language}
              </span>
            )}
          </div>
        )}

        {resource.type === ResourceType.BOOKMARK && resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline text-sm group"
          >
            <span className="truncate">{resource.url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )}
      </div>

      {/* Tags */}
      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
          {resource.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{resource.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
