# Legal (S-02.3 / E) — qué falta antes de comercializar

Los textos de **Términos** (`apps/web/src/pages/TermsPage.tsx`) y **Privacidad**
(`apps/web/src/pages/PrivacyPage.tsx`) son **borradores completos y fieles al
sistema**, pero NO son el documento final. La app móvil enlaza a estas mismas
páginas web desde el registro.

## ⚠️ Requisito bloqueante

Un profesional legal debe revisar y aprobar ambos textos **antes** de cobrar a
usuarios. Horus guarda datos financieros y de salud/fitness/nutrición, que en
varias jurisdicciones (p. ej. GDPR) son "categorías especiales" con requisitos
más estrictos. Esto no es opcional.

## Placeholders a completar (campos `[…]` en los textos)

- `[RAZÓN SOCIAL / TITULAR]` — quién opera el servicio (persona o empresa).
- `[domicilio]` — domicilio legal del responsable.
- `[email de contacto]` — correo para privacidad/soporte/reclamos.
- `[JURISDICCIÓN]` — ley aplicable y tribunales (founder en Argentina → Ley
  25.326 / futura ley de datos; además GDPR si hay usuarios en la UE).
- `[región]` — región de hosting de Railway (dónde viven los datos).
- `[16/18]` — edad mínima según la jurisdicción elegida.

## Subprocesadores ya declarados (verificar y mantener al día)

Railway (hosting + PostgreSQL), Lemon Squeezy (pagos web), Google Play (pagos
móvil), Resend (email), Firebase Cloud Messaging + Web Push (notificaciones),
Sentry (errores), Google/Microsoft (calendario, opcional). Si agregás o quitás
un proveedor, actualizá la sección 5 de la Política de Privacidad.

## Al publicar la versión final

1. Reemplazar todos los `[…]` por los valores reales.
2. Quitar los banners de "Borrador" en `TermsPage.tsx` y `PrivacyPage.tsx`.
3. Bumpear `CURRENT_TERMS_VERSION` en `packages/shared/src/constants/legal.ts`
   (p. ej. a `2026-09-v1`). El bump fuerza a los usuarios existentes a aceptar
   de nuevo (re-consentimiento), que es justamente lo que querés al pasar de
   borrador a versión final.
4. Confirmar que el flujo de re-consentimiento se dispara para los usuarios ya
   registrados.

## Estado

- ✅ Borradores redactados (este commit), banner de "borrador" visible, derechos
  GDPR (export/borrado) ya implementados y descriptos.
- ⏳ Revisión legal profesional + completar placeholders + bump de versión.
