/**
 * Privacy Policy — DRAFT (S-02.3)
 *
 * Placeholder content. The final text MUST be drafted/reviewed by a legal
 * professional before commercial launch. Especially sensitive given Horus
 * stores financial and health-adjacent data (nutrition, workouts).
 */

import { Link } from 'react-router-dom';
import { CURRENT_TERMS_VERSION } from '@horus/shared';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          ⚠️ Borrador — versión <strong>{CURRENT_TERMS_VERSION}</strong>. Texto pendiente de
          revisión legal profesional; no constituye un documento final.
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Política de Privacidad</h1>

        <div className="prose prose-sm text-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Qué datos guardamos</h2>
          <p>
            Tu perfil (nombre, email) y los datos que creás en la app: hábitos, tareas, eventos,
            metas, transacciones y cuentas, entrenamientos y datos de nutrición.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Para qué los usamos</h2>
          <p>
            Para brindarte el servicio. No vendemos tus datos. Usamos proveedores para email
            transaccional, notificaciones push y monitoreo de errores.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Tus derechos</h2>
          <p>
            Podés acceder y exportar tus datos (formato JSON) y solicitar su eliminación permanente
            desde la configuración de perfil.
          </p>
          <h2 className="text-lg font-semibold text-gray-900">Contacto</h2>
          <p>Para consultas de privacidad, escribinos al correo de soporte.</p>
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
