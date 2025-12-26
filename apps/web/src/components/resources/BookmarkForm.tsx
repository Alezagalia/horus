import { Link } from 'lucide-react';

interface BookmarkFormProps {
  url: string;
  onUrlChange: (url: string) => void;
}

export function BookmarkForm({ url, onUrlChange }: BookmarkFormProps) {
  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          URL del enlace
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Link className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://ejemplo.com"
            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              url && !isValidUrl(url) ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        </div>
        {url && !isValidUrl(url) && (
          <p className="mt-1 text-sm text-red-600">Por favor ingresa una URL válida</p>
        )}
      </div>

      {/* Preview */}
      {url && isValidUrl(url) && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {url}
          </a>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500">
        Ingresa la URL completa incluyendo http:// o https://
      </div>
    </div>
  );
}
