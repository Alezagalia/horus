/**
 * Loading Fallback Component
 * Sprint 11 - US-104
 *
 * Componente de carga mostrado durante lazy loading de rutas
 */

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-sm">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * Loading Fallback para uso dentro del layout (sin full screen)
 */
export function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-gray-600 text-sm">Cargando página...</p>
      </div>
    </div>
  );
}
