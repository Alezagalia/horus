import { useState } from 'react';
import { Eye, Edit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NoteEditor({ value, onChange, placeholder }: NoteEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setShowPreview(false)}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            !showPreview
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Edit className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            showPreview
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          Vista Previa
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="min-h-96 p-4 border rounded-lg bg-gray-50 prose prose-sm max-w-none">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400">Sin contenido para previsualizar</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Escribe tu nota en Markdown...\n\n# Título\n## Subtítulo\n\n**Negrita** *Cursiva*\n\n- Lista\n- Item 2\n\n[Enlaces](https://ejemplo.com)'}
          className="w-full min-h-96 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          spellCheck={false}
        />
      )}

      {/* Helper text */}
      <div className="text-xs text-gray-500">
        Soporta Markdown: <code className="px-1 bg-gray-100 rounded">**negrita**</code>,{' '}
        <code className="px-1 bg-gray-100 rounded">*cursiva*</code>,{' '}
        <code className="px-1 bg-gray-100 rounded"># títulos</code>,{' '}
        <code className="px-1 bg-gray-100 rounded">- listas</code>,{' '}
        <code className="px-1 bg-gray-100 rounded">[enlaces](url)</code>
      </div>
    </div>
  );
}
