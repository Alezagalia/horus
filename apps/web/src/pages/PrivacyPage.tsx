/**
 * Privacy Policy — DRAFT (S-02.3)
 *
 * Comprehensive draft tailored to Horus's real data flows and subprocessors.
 * MUST still be reviewed/approved by a legal professional before commercial
 * launch — Horus stores financial and health-adjacent data (nutrition,
 * workouts), which raises the bar (e.g. special-category data under GDPR).
 * Business-specific facts (legal entity, jurisdiction, contact, hosting region)
 * are left as [bracketed] placeholders.
 */

import { Link } from 'react-router-dom';
import { CURRENT_TERMS_VERSION } from '@horus/shared';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          ⚠️ Borrador — versión <strong>{CURRENT_TERMS_VERSION}</strong>. Texto preliminar pendiente
          de revisión legal profesional; no constituye un documento final ni asesoría legal.
          Especialmente sensible porque Horus almacena datos financieros y de salud/fitness. Los
          campos entre corchetes <code>[…]</code> deben completarse antes de publicar.
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-400 mb-6">Última actualización: {CURRENT_TERMS_VERSION}</p>

        <div className="text-gray-700 space-y-6 text-sm leading-relaxed">
          <p>
            Esta Política explica qué datos personales tratamos en Horus (el “Servicio”), con qué
            fines y qué derechos tenés. El responsable del tratamiento es [RAZÓN SOCIAL / TITULAR],
            con domicilio en [domicilio] y contacto en [email de contacto].
          </p>

          <Section title="1. Qué datos recopilamos">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Datos de cuenta:</strong> nombre, email y contraseña (almacenada de forma
                cifrada con hash, nunca en texto plano).
              </li>
              <li>
                <strong>Contenido que creás:</strong> hábitos, tareas y checklists, eventos y
                calendario, metas y objetivos, datos financieros (cuentas, transacciones, gastos
                recurrentes), fitness (ejercicios, rutinas, entrenamientos), nutrición (alimentos,
                recetas, planes y registros) y notas/recursos de tu base de conocimiento.
              </li>
              <li>
                <strong>Configuración:</strong> preferencias, valor por hora, ajustes de
                notificaciones y tu consentimiento legal (versión y fecha).
              </li>
              <li>
                <strong>Datos técnicos:</strong> tokens de sesión, identificadores de dispositivo
                para notificaciones push, y registros (logs) de uso y errores con fines de seguridad
                y diagnóstico.
              </li>
              <li>
                <strong>Integraciones opcionales:</strong> si conectás Google Calendar u otro
                calendario, accedemos a los datos necesarios para la sincronización; los tokens de
                acceso se guardan cifrados.
              </li>
            </ul>
          </Section>

          <Section title="2. Datos sensibles">
            <p>
              Parte de tu Contenido (datos financieros, de actividad física y de nutrición) puede
              considerarse sensible según la legislación aplicable. Lo tratás vos voluntariamente
              para tu uso personal dentro del Servicio, sobre la base de tu consentimiento, y podés
              eliminarlo en cualquier momento.
            </p>
          </Section>

          <Section title="3. Para qué usamos tus datos">
            <p>
              Usamos tus datos para prestarte el Servicio y sus funciones, autenticarte y proteger
              tu cuenta, enviarte notificaciones que configuraste, procesar tu suscripción si pasás
              a Pro, y mantener la seguridad y el correcto funcionamiento.{' '}
              <strong>No vendemos tus datos</strong> ni los usamos para publicidad de terceros.
            </p>
          </Section>

          <Section title="4. Base legal del tratamiento">
            <p>
              Tratamos tus datos para ejecutar el contrato de prestación del Servicio, con tu
              consentimiento (que podés retirar), para cumplir obligaciones legales y sobre la base
              de nuestro interés legítimo en la seguridad del Servicio, según corresponda a tu
              jurisdicción.
            </p>
          </Section>

          <Section title="5. Proveedores que nos ayudan (subencargados)">
            <p>
              Compartimos datos únicamente con proveedores que procesan información por nuestra
              cuenta y bajo obligaciones de confidencialidad, en la medida necesaria para operar:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Hosting y base de datos:</strong> Railway (servidores de aplicación y base
                de datos PostgreSQL), en la región [región].
              </li>
              <li>
                <strong>Pagos:</strong> Lemon Squeezy (web, como comerciante registrado) y Google
                Play (compras en la app móvil).
              </li>
              <li>
                <strong>Email transaccional:</strong> Resend (verificación de email, recuperación de
                contraseña).
              </li>
              <li>
                <strong>Notificaciones push:</strong> Firebase Cloud Messaging y Web Push.
              </li>
              <li>
                <strong>Monitoreo de errores:</strong> Sentry.
              </li>
              <li>
                <strong>Calendario (opcional):</strong> Google / Microsoft, solo si conectás esas
                integraciones.
              </li>
            </ul>
            <p>
              Algunos proveedores pueden procesar datos fuera de tu país; cuando aplique, se
              utilizan las garantías de transferencia internacional previstas por la ley.
            </p>
          </Section>

          <Section title="6. Conservación de datos">
            <p>
              Conservamos tu Contenido mientras tu cuenta esté activa. Los tokens de seguridad
              expirados o usados se purgan periódicamente. Si eliminás tu cuenta, borramos tus datos
              de forma permanente (con posibles excepciones legales y copias de respaldo que se
              sobrescriben en plazos acotados). Las cuentas inactivas durante un período prolongado
              pueden eliminarse previo aviso.
            </p>
          </Section>

          <Section title="7. Seguridad">
            <p>
              Aplicamos medidas técnicas y organizativas razonables: cifrado en tránsito (HTTPS),
              hash de contraseñas, cifrado de tokens de integraciones, control de acceso por
              usuario, límites de tasa y bloqueo por intentos fallidos de inicio de sesión. Ningún
              sistema es 100% seguro, pero trabajamos para proteger tu información.
            </p>
          </Section>

          <Section title="8. Tus derechos">
            <p>
              Según tu jurisdicción, podés ejercer derechos de acceso, rectificación, eliminación,
              portabilidad y oposición. En la práctica:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Acceso y portabilidad:</strong> exportá una copia completa de tus datos en
                formato JSON desde la configuración de perfil.
              </li>
              <li>
                <strong>Eliminación:</strong> borrá tu cuenta y todos tus datos de forma permanente
                desde la configuración de perfil.
              </li>
              <li>
                <strong>Consentimiento:</strong> podés retirarlo; si cambian los términos de forma
                material, te pediremos un nuevo consentimiento.
              </li>
            </ul>
            <p>
              Para cualquier solicitud o reclamo, escribinos a [email de contacto]. También podés
              acudir a la autoridad de protección de datos de tu jurisdicción.
            </p>
          </Section>

          <Section title="9. Menores de edad">
            <p>
              El Servicio no está dirigido a menores de [16/18] años y no recopilamos
              conscientemente sus datos.
            </p>
          </Section>

          <Section title="10. Cambios en esta Política">
            <p>
              Podemos actualizar esta Política. La versión vigente se identifica arriba; ante
              cambios materiales, te lo notificaremos y, cuando corresponda, te pediremos nuevamente
              tu consentimiento.
            </p>
          </Section>
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
