import { useState } from 'react';
import { Eye, Edit } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Type workaround for React 19 compatibility
const SyntaxHighlighterComponent = SyntaxHighlighter as any;

interface SnippetEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Texto plano' },
];

export function SnippetEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
}: SnippetEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      {/* Language selector and tabs */}
      <div className="flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">
            Lenguaje:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Preview toggle */}
        <div className="flex gap-2">
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
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="rounded-lg overflow-hidden">
          {code ? (
            <SyntaxHighlighterComponent
              language={language}
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                maxHeight: '24rem',
              }}
            >
              {code}
            </SyntaxHighlighterComponent>
          ) : (
            <div className="p-4 bg-gray-900 text-gray-400 rounded-lg text-sm">
              Sin código para previsualizar
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Pega tu código aquí..."
          className="w-full h-96 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y bg-gray-50"
          spellCheck={false}
        />
      )}

      {/* Info */}
      <div className="text-xs text-gray-500">
        Líneas: {code.split('\n').length} | Caracteres: {code.length}
      </div>
    </div>
  );
}
