/**
 * RecipeDetailModal - vista completa de una receta
 * Muestra descripción, pasos de preparación, ingredientes y macros
 * F-17
 */

import type { RecipeWithIngredients } from '@horus/shared';
import { MacrosBadge } from './MacrosBadge';

interface RecipeDetailModalProps {
  recipe: RecipeWithIngredients;
  open: boolean;
  onClose: () => void;
  onEdit?: (recipe: RecipeWithIngredients) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Description parser
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedBlock {
  header: string | null;
  inlineText: string; // texto en la misma línea que el header
  steps: string[]; // líneas que empiezan con "N."
  plainLines: string[]; // otras líneas del bloque
}

function parseDescription(description: string): ParsedBlock[] {
  // Separar por doble salto de línea
  const rawBlocks = description.trim().split(/\n\n+/);

  return rawBlocks
    .map((raw) => {
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) return null;

      const firstLine = lines[0];
      // Header = línea que contiene al menos 3 mayúsculas/acentuadas seguidas de ':'
      const headerMatch = firstLine.match(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z\s*]+):\s*(.*)/);

      if (headerMatch) {
        const header = headerMatch[1].trim();
        const inlineText = headerMatch[2].trim();
        const rest = lines.slice(1);
        return {
          header,
          inlineText,
          steps: rest.filter((l) => /^\d+\./.test(l)),
          plainLines: rest.filter((l) => !/^\d+\./.test(l)),
        };
      }

      // Bloque de texto plano (párrafo de introducción)
      return {
        header: null,
        inlineText: '',
        steps: [],
        plainLines: lines,
      };
    })
    .filter(Boolean) as ParsedBlock[];
}

// Estilo visual según tipo de sección
function getSectionStyle(header: string): {
  bg: string;
  border: string;
  label: string;
  numBg: string;
  numText: string;
} {
  const h = header.toUpperCase();
  if (
    h.includes('PREPARACI') ||
    h.includes('RELLENO') ||
    h.includes('ARMADO') ||
    h.includes('MASA')
  )
    return {
      bg: 'bg-indigo-50',
      border: 'border-indigo-300',
      label: 'text-indigo-700',
      numBg: 'bg-indigo-600',
      numText: 'text-white',
    };
  if (h.includes('NI') && h.includes('O'))
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      label: 'text-amber-700',
      numBg: 'bg-amber-500',
      numText: 'text-white',
    };
  if (h.includes('CONGELAR'))
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      label: 'text-blue-700',
      numBg: 'bg-blue-600',
      numText: 'text-white',
    };
  if (h.includes('RECALENTAR'))
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      label: 'text-orange-700',
      numBg: 'bg-orange-500',
      numText: 'text-white',
    };
  // NOTA, etc.
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    label: 'text-gray-700',
    numBg: 'bg-gray-500',
    numText: 'text-white',
  };
}

function DescriptionRenderer({ description }: { description: string }) {
  const blocks = parseDescription(description);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (!block.header) {
          // Párrafo de introducción
          return (
            <p key={i} className="text-sm text-gray-600 leading-relaxed">
              {block.plainLines.join(' ')}
            </p>
          );
        }

        const style = getSectionStyle(block.header);
        const hasContent =
          block.inlineText || block.steps.length > 0 || block.plainLines.length > 0;

        return (
          <div key={i} className={`rounded-xl border-l-4 ${style.border} ${style.bg} px-4 py-3`}>
            {/* Header de la sección */}
            <p className={`text-xs font-bold uppercase tracking-wider ${style.label} mb-2`}>
              {block.header}
            </p>

            {/* Texto inline (ej. "TIPS PARA EL NIÑO: texto aquí") */}
            {block.inlineText && (
              <p className="text-sm text-gray-700 leading-relaxed">{block.inlineText}</p>
            )}

            {/* Pasos numerados */}
            {block.steps.length > 0 && (
              <ol className="space-y-2 mt-1">
                {block.steps.map((step, j) => {
                  const m = step.match(/^(\d+)\.\s*(.*)/);
                  const num = m ? m[1] : String(j + 1);
                  const text = m ? m[2] : step;
                  return (
                    <li key={j} className="flex gap-3 items-start">
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${style.numBg} ${style.numText} mt-0.5`}
                      >
                        {num}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Líneas de texto plano dentro de la sección */}
            {block.plainLines.map((line, j) => (
              <p key={j} className="text-sm text-gray-700 mt-1 leading-relaxed">
                {line}
              </p>
            ))}

            {!hasContent && <p className="text-sm text-gray-400 italic">—</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal principal
// ─────────────────────────────────────────────────────────────────────────────

export function RecipeDetailModal({ recipe, open, onClose, onEdit }: RecipeDetailModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header sticky ────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{recipe.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {recipe.servings} porciones &middot; {recipe.ingredients.length} ingredientes
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(recipe);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Macros por porción */}
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-1.5">Macros por porción</p>
            <MacrosBadge macros={recipe.macrosPerServing} size="sm" />
          </div>
        </div>

        {/* ── Body scrollable ──────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Ingredientes */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ingredientes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ing.food.name}</p>
                    {ing.notes && <p className="text-xs text-gray-400 truncate">{ing.notes}</p>}
                  </div>
                  <span className="text-sm font-semibold text-indigo-600 shrink-0">
                    {Number(ing.grams)}
                    {ing.food.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Descripción / Pasos */}
          {recipe.description && (
            <section className="border-t pt-5">
              <DescriptionRenderer description={recipe.description} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
