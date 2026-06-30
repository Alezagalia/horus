/**
 * Terms of Service — DRAFT (S-02.3)
 *
 * Comprehensive draft tailored to how Horus actually works. The final text MUST
 * still be reviewed/approved by a legal professional before commercial launch
 * (financial + health-adjacent data raises the bar). Business-specific facts
 * (legal entity, jurisdiction, contact) are left as [bracketed] placeholders.
 * Versioned by CURRENT_TERMS_VERSION.
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

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          ⚠️ Borrador — versión <strong>{CURRENT_TERMS_VERSION}</strong>. Texto preliminar pendiente
          de revisión legal profesional; no constituye un documento final ni asesoría legal. Los
          campos entre corchetes <code>[…]</code> deben completarse antes de publicar.
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-gray-400 mb-6">Última actualización: {CURRENT_TERMS_VERSION}</p>

        <div className="text-gray-700 space-y-6 text-sm leading-relaxed">
          <p>
            Estos Términos y Condiciones (los “Términos”) regulan el uso de Horus (el “Servicio”),
            operado por [RAZÓN SOCIAL / TITULAR] (“nosotros”). Al crear una cuenta o usar el
            Servicio aceptás estos Términos y nuestra{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500">
              Política de Privacidad
            </Link>
            . Si no estás de acuerdo, no uses el Servicio.
          </p>

          <Section title="1. Descripción del servicio">
            <p>
              Horus es una aplicación de productividad personal que te permite gestionar hábitos,
              tareas, eventos y calendario, metas y objetivos, finanzas personales (cuentas,
              transacciones, gastos), fitness (rutinas y entrenamientos), nutrición y una base de
              conocimiento personal. El Servicio se ofrece “tal cual” y puede evolucionar con el
              tiempo.
            </p>
          </Section>

          <Section title="2. Cuenta y seguridad">
            <p>
              Para usar el Servicio necesitás crear una cuenta con un email válido. Sos responsable
              de la confidencialidad de tu contraseña y de toda la actividad realizada bajo tu
              cuenta. Notificanos de inmediato ante cualquier uso no autorizado. Debés tener al
              menos [16/18] años para usar el Servicio.
            </p>
          </Section>

          <Section title="3. Uso aceptable">
            <p>
              Te comprometés a no usar el Servicio con fines ilícitos, a no vulnerar su seguridad, a
              no intentar acceder a datos de otros usuarios, y a no sobrecargar o interferir con la
              infraestructura. Podemos suspender o cerrar cuentas que infrinjan estos Términos.
            </p>
          </Section>

          <Section title="4. Tu contenido y tus datos">
            <p>
              Conservás la titularidad de la información que cargás (tu “Contenido”). Nos otorgás
              una licencia limitada para almacenarla y procesarla con el único fin de prestarte el
              Servicio. Podés exportar tu Contenido en formato JSON o eliminar tu cuenta de forma
              permanente en cualquier momento desde la configuración de perfil. El tratamiento de
              datos personales se describe en la{' '}
              <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500">
                Política de Privacidad
              </Link>
              .
            </p>
          </Section>

          <Section title="5. Planes, suscripciones y pagos">
            <p>
              El Servicio ofrece un plan gratuito y un plan de pago (“Pro”) por suscripción. En la
              web, los pagos se procesan a través de Lemon Squeezy, que actúa como comerciante
              registrado (Merchant of Record) y gestiona impuestos aplicables. En la app móvil, las
              compras se procesan mediante Google Play y están sujetas a sus condiciones. Las
              suscripciones se renuevan automáticamente hasta su cancelación. Salvo que la ley
              aplicable o la tienda indiquen lo contrario, los pagos no son reembolsables por
              períodos ya transcurridos. Podés cancelar la renovación en cualquier momento; el
              acceso Pro se mantiene hasta el fin del período pago.
            </p>
          </Section>

          <Section title="6. Integraciones de terceros">
            <p>
              Si conectás servicios externos (por ejemplo, Google Calendar o Microsoft), su uso se
              rige también por los términos de esos proveedores. Podés revocar el acceso cuando
              quieras. No nos responsabilizamos por servicios de terceros.
            </p>
          </Section>

          <Section title="7. Aviso importante (finanzas y salud)">
            <p>
              Horus es una herramienta de organización personal. No brinda asesoramiento financiero,
              contable, médico, nutricional ni profesional de ningún tipo. La información que
              registres o que el Servicio muestre no debe sustituir el consejo de un profesional
              calificado.
            </p>
          </Section>

          <Section title="8. Disponibilidad y garantías">
            <p>
              Hacemos esfuerzos razonables por mantener el Servicio disponible, pero no garantizamos
              que sea ininterrumpido o libre de errores. El Servicio se provee “tal cual” y “según
              disponibilidad”, sin garantías de ningún tipo en la máxima medida permitida por la
              ley.
            </p>
          </Section>

          <Section title="9. Limitación de responsabilidad">
            <p>
              En la máxima medida permitida por la ley aplicable, no seremos responsables por daños
              indirectos, incidentales o consecuentes, ni por pérdida de datos o lucro cesante
              derivados del uso o la imposibilidad de uso del Servicio. Mantené copias propias de la
              información importante (podés exportarla cuando quieras).
            </p>
          </Section>

          <Section title="10. Cambios en los Términos">
            <p>
              Podemos actualizar estos Términos. Cuando los cambios sean materiales, te pediremos
              que los aceptes nuevamente antes de seguir usando el Servicio. La versión vigente se
              identifica arriba.
            </p>
          </Section>

          <Section title="11. Ley aplicable y contacto">
            <p>
              Estos Términos se rigen por las leyes de [JURISDICCIÓN] y cualquier disputa se
              someterá a sus tribunales competentes. Para consultas, escribinos a{' '}
              <span className="font-medium">[email de contacto]</span>.
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
