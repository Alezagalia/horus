import { ResourceType } from '@horus/shared';
import { FileText, Code, Bookmark } from 'lucide-react';

interface ResourceTypeSelectorProps {
  selected: ResourceType;
  onSelect: (type: ResourceType) => void;
}

export function ResourceTypeSelector({ selected, onSelect }: ResourceTypeSelectorProps) {
  const types = [
    { type: ResourceType.NOTE, icon: FileText, label: 'Nota', color: 'blue' },
    { type: ResourceType.SNIPPET, icon: Code, label: 'Código', color: 'green' },
    { type: ResourceType.BOOKMARK, icon: Bookmark, label: 'Enlace', color: 'orange' },
  ];

  return (
    <div className="flex gap-2">
      {types.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
            selected === type
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
