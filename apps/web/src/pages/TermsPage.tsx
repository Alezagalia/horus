/**
 * Terms of Service — DRAFT (S-02.3)
 *
 * Placeholder content. The final text MUST be drafted/reviewed by a legal
 * professional before commercial launch. Versioned by CURRENT_TERMS_VERSION.
 */

import { Link } from 'react-router-dom';
import { CURRENT_TERMS_VERSION } from '@horus/shared';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          ⚠️ Borrador — versión <strong>{CURRENT_TERMS_VERSION}</strong>. Texto pendiente de
          revisión legal profesional; no constituye un documento final.
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Términos y Condiciones</h1>

        <div className="prose prose-sm text-gray-700 space-y-4">
          <p>
            Al crear una cuenta y usar Horus aceptás estos términos. Horus es una aplicación de
            productividad personal que te permite gestionar hábitos, tareas, metas, finanzas,
            fitness y nutrición.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Uso del servicio</h2>
          <p>
            Sos responsable de la actividad de tu cuenta y de mantener tu contraseña segura. No
            debés usar el servicio para fines ilícitos.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Tus datos</h2>
          <p>
            Podés exportar tus datos o eliminar tu cuenta en cualquier momento desde la
            configuración de perfil. El tratamiento de datos se describe en la{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500">
              Política de Privacidad
            </Link>
            .
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Cambios</h2>
          <p>
            Podemos actualizar estos términos. Si los cambios son materiales, te pediremos que los
            aceptes nuevamente.
          </p>
        </div>

        <div className="mt-8">
          <Link
            to="/register"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            ← Volver al registro
          </Link>
        </div>
      </div>
    </div>
  );
}
