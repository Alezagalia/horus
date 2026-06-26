# Horus — Análisis de comercialización

> Documento de análisis funcional para llevar Horus de uso personal a producto comercial.
> Rol: análisis funcional + estrategia de producto.
> Decisiones base de este documento:
>
> - **Posicionamiento:** núcleo de **productividad** (hábitos + tareas + metas). Finanzas, fitness y nutrición pasan a ser features de valor (mayormente Pro), no el mensaje principal.
> - **Monetización:** **freemium + suscripción** (plan Free permanente + Pro mensual/anual).
> - **Tipo de producto:** B2C SaaS (cada usuario su cuenta). No es B2B/equipos.
>   Última actualización: 2026-06-24

---

## 1. Resumen ejecutivo

Horus es funcionalmente muy completo (hábitos, tareas, eventos, finanzas, fitness, nutrición, metas/OKRs, revisión semanal). Esa amplitud **ya está construida y es un activo**, pero **no es el cuello de botella para comercializar**. Los bloqueantes reales son tres capas hoy inexistentes o incompletas:

1. **Capa de negocio** — planes, suscripción, pagos, límites por plan. Hoy: **cero**.
2. **Capa legal y de seguridad** — términos, privacidad, borrado/exportación de datos, roles de admin, verificación de email. Hoy: **incompleta o ausente**.
3. **Capa de activación** — onboarding, estados vacíos, analítica de producto, funnel de conversión. Hoy: **inexistente** (la app asume un usuario experto: tú).

La buena noticia: el **aislamiento multi-usuario ya existe** (todo cuelga de `User` por `userId`), así que **no hace falta re-arquitectura multi-tenant**. El trabajo es aditivo, no refactor estructural.

### Riesgo de posicionamiento

La mayor amenaza comercial no es técnica: es que Horus es una "super app" difícil de explicar. La decisión tomada —**vender el núcleo de productividad** y relegar el resto a features Pro— mitiga esto. El mensaje de venta debe ser **uno**: _"sistema de productividad personal que conecta hábitos, tareas y metas"_. Finanzas/fitness/nutrición se comunican como _"y además…"_, no como propuesta principal.

---

## 2. Diagnóstico del estado actual (hallazgos del código)

| Capacidad                             | Estado    | Evidencia                                                                                               |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| Aislamiento de datos por usuario      | ✅ Existe | Todo modelo cuelga de `User` vía `userId` (schema.prisma)                                               |
| Auth (JWT + refresh + reset password) | ✅ Existe | `auth.routes.ts`, `PasswordResetToken`                                                                  |
| Verificación de email                 | ❌ Falta  | No hay modelo ni flujo de verify                                                                        |
| Roles / admin                         | ❌ Falta  | `admin.routes.ts`: `TODO: Add admin role check`. Endpoint admin abierto a cualquier usuario autenticado |
| Planes / suscripción / billing        | ❌ Falta  | Sin coincidencias de `subscription/plan/billing/tier` en schema ni src                                  |
| Límites / feature-gating              | ❌ Falta  | Todo es ilimitado y gratuito                                                                            |
| Términos / Privacidad                 | ❌ Falta  | No existen                                                                                              |
| Borrado real de cuenta + export       | ❌ Falta  | Solo soft-delete (`isActive`)                                                                           |
| Analítica de producto                 | ❌ Falta  | Hay Sentry (errores) pero no PostHog/Amplitude (comportamiento)                                         |
| Onboarding / estados vacíos           | ❌ Falta  | App asume usuario experto                                                                               |
| Migraciones versionadas en prod       | ⚠️ Riesgo | Se usa `prisma db push` (sin shadow DB en Railway) — peligroso con datos de clientes                    |
| iOS                                   | ❌ Falta  | Mobile solo Android                                                                                     |
| Firma de release móvil                | ⚠️ Riesgo | APK firmado con `debug.keystore` — no publicable así                                                    |
| Observabilidad (errores)              | ✅ Existe | Sentry + Winston                                                                                        |
| Push / notificaciones                 | ✅ Base   | FCM configurado; falta estrategia de re-engagement                                                      |

---

## 3. Definición del producto comercial

### 3.1 Segmentación de planes (propuesta)

Coherente con el posicionamiento de **productividad** como núcleo gratuito y el resto como valor Pro.

| Capacidad                                       | Free                      | Pro                     |
| ----------------------------------------------- | ------------------------- | ----------------------- |
| Hábitos                                         | Hasta 5 hábitos activos   | Ilimitados              |
| Tareas + checklist                              | ✅                        | ✅                      |
| Metas / OKRs                                    | 1 meta activa             | Ilimitadas              |
| Revisión semanal                                | ✅ básica                 | ✅ + histórico completo |
| Calendario propio                               | ✅                        | ✅                      |
| Sync Google/Microsoft Calendar                  | ❌                        | ✅                      |
| Finanzas (cuentas, transacciones, presupuestos) | Solo lectura / 1 cuenta   | Completo                |
| Fitness (rutinas, workouts)                     | ❌ o limitado             | ✅                      |
| Nutrición (recetas, plan, compras)              | ❌                        | ✅                      |
| Estadísticas avanzadas / insights               | ❌                        | ✅                      |
| Histórico de datos                              | Limitado (p. ej. 90 días) | Completo                |

> Nota: el reparto exacto se ajusta con datos de conversión. La regla de diseño: **Free debe ser usable y generar el hábito de uso diario**; Pro desbloquea profundidad y los módulos "de vida completa" (finanzas/fitness/nutrición).

### 3.2 Precios (hipótesis a validar)

- **Mensual:** ~USD 4–6 / mes.
- **Anual:** ~USD 36–48 / año (descuento ~30–40% vs mensual).
- **Trial Pro:** 7–14 días al registrarse (aumenta activación antes de pedir tarjeta).
- Ajustar con **paridad de poder adquisitivo** si el mercado objetivo es LATAM.

---

## 4. Épicas y backlog (priorizado)

Nomenclatura `C-XX` (Comercialización) para no chocar con las `F-XX` del backlog funcional. Estimación en _tallas_ (S ≈ 1-3 días, M ≈ 1 semana, L ≈ 2-3 semanas, XL ≈ 1 mes+). Prioridad P0 (bloqueante) → P2 (escalado).

### Épica C-01 · Roles y administración segura — **P0 · M**

Hoy `/api/admin` es accesible por cualquier usuario autenticado.

- **C-01.1** Añadir `role` (`USER` | `ADMIN`) a `User` en schema + migración. _(S)_
- **C-01.2** `adminRoleMiddleware` y aplicarlo a `admin.routes.ts` y cualquier endpoint sensible. _(S)_
- **C-01.3** Auditar todos los endpoints: confirmar que cada uno filtra por `userId` del token (no por parámetro). _(M)_
- **C-01.4** Panel admin mínimo (usuarios, suscripciones, métricas). _(M)_

### Épica C-02 · Cumplimiento legal y privacidad — **P0 · L**

Bloqueante para cobrar y para publicar en tiendas.

- **C-02.1** Términos y Condiciones + Política de Privacidad (con asesoría legal). _(M)_
- **C-02.2** Consentimiento explícito en registro + registro de aceptación (versión + fecha). _(S)_
- **C-02.3** **Exportar mis datos** (JSON/CSV de todo lo del usuario). _(M)_
- **C-02.4** **Borrar mi cuenta** con borrado real / anonimización (no solo `isActive`), respetando retención legal. _(M)_
- **C-02.5** Política de retención y purga de datos inactivos. _(S)_
- **C-02.6** Revisión de datos sensibles (finanzas + salud): cifrado en reposo de campos críticos, minimización. _(L)_

### Épica C-03 · Seguridad de cuenta — **P0 · M**

- **C-03.1** Verificación de email en registro. _(M)_
- **C-03.2** Rate-limit y lockout en login / reset password. _(S)_
- **C-03.3** Rotación/gestión de secretos (JWT secret, claves) + revisar que `.env` real no esté versionado. _(S)_
- **C-03.4** (Opcional v2) MFA / 2FA. _(M)_

### Épica C-04 · Modelo de suscripción y facturación — **P1 · XL**

El corazón de la monetización.

- **C-04.1** Schema: `Subscription` (estado, plan, periodo, `currentPeriodEnd`, `cancelAtPeriodEnd`), enum de planes, entitlements. _(M)_
- **C-04.2** Integración **Stripe** (web): checkout, customer portal, webhooks (pago ok/fallido, cancelación, dunning). _(L)_
- **C-04.3** **Compras in-app** Google Play (y App Store si hay iOS): obligatorias para suscripción digital en móvil; no se puede usar Stripe dentro de la app. _(L)_
- **C-04.4** Reconciliación de estado entre Stripe e IAP (un usuario, una fuente de verdad del entitlement). _(M)_
- **C-04.5** Estados de ciclo de vida: trial → activo → past*due → cancelado → expirado, con emails transaccionales. *(M)\_

### Épica C-05 · Feature-gating y límites por plan — **P1 · L**

- **C-05.1** Servicio central de entitlements (`canUser(userId, feature)`). _(M)_
- **C-05.2** Middleware backend que bloquea/limita por plan (p. ej. máx hábitos, sync calendario). _(M)_
- **C-05.3** UI de gating en web y mobile (paywalls contextuales, "desbloquear con Pro"). _(M)_
- **C-05.4** Página de pricing + flujo de upgrade/downgrade/cancelar. _(M)_

### Épica C-06 · Onboarding y activación — **P1 · L**

Sin esto, el marketing llena un balde sin fondo.

- **C-06.1** Wizard de primer uso (elegir foco, crear 1er hábito/tarea/meta). _(M)_
- **C-06.2** Datos de ejemplo / plantillas (hábitos sugeridos, categorías por defecto). _(M)_
- **C-06.3** Estados vacíos accionables en cada módulo. _(M)_
- **C-06.4** Checklist de activación ("completa tu perfil productivo"). _(S)_

### Épica C-07 · Analítica de producto y growth — **P1 · M**

- **C-07.1** Integrar PostHog/Amplitude (web + mobile): eventos de activación, retención D1/D7/D30. _(M)_
- **C-07.2** Funnel free→trial→pro instrumentado. _(S)_
- **C-07.3** Estrategia de re-engagement con el push (FCM ya existe): recordatorios, rachas en riesgo. _(M)_

### Épica C-08 · Operación y confiabilidad — **P2 · L**

- **C-08.1** Migrar de `prisma db push` a **migraciones versionadas** (`migrate deploy`) en prod. _(M)_ — riesgo de pérdida de datos si no se hace antes de tener clientes.
- **C-08.2** Backups automáticos verificados + procedimiento de restore probado. _(M)_
- **C-08.3** Monitoreo de uptime + página de estado + alertas. _(S)_
- **C-08.4** Idempotencia de jobs cron y plan de migración a cola si crece el volumen. _(M)_
- **C-08.5** Centro de ayuda / FAQ + canal de soporte + feedback in-app. _(M)_

### Épica C-09 · Distribución móvil completa — **P2 · XL**

- **C-09.1** Firma de release real (keystore de producción, no `debug.keystore`). _(S)_
- **C-09.2** Publicación Play Store: ficha, _data safety form_, URL de privacidad. _(M)_
- **C-09.3** **Build iOS** (cuenta Apple Developer, IAP, revisión). _(L)_
- **C-09.4** Documentar deuda técnica conocida (New Arch desactivada por bug DeX/Samsung). _(S)_

### Épica C-10 · Internacionalización — **P2 · M** _(opcional según mercado)_

- **C-10.1** i18n web + mobile (la app está en español). _(L)_
- **C-10.2** Inglés como segundo idioma si se busca escala fuera de LATAM. _(M)_

---

## 5. Roadmap por fases

### Fase 1 — "Legalmente vendible" (P0) · ~4-6 semanas

C-01 (roles), C-02 (legal/privacidad), C-03 (seguridad de cuenta).
**Hito:** la app puede cobrar y publicarse sin riesgo legal/seguridad.

### Fase 2 — "Monetizable" (P1) · ~6-8 semanas

C-04 (suscripción/Stripe/IAP), C-05 (feature-gating + pricing).
**Hito:** un usuario puede pagar y desbloquear Pro.

### Fase 3 — "Convertible" (P1) · ~3-4 semanas

C-06 (onboarding), C-07 (analítica + growth).
**Hito:** funnel free→pro medible y optimizable.

### Fase 4 — "Escalable" (P2) · continuo

C-08 (operación), C-09 (iOS + tiendas), C-10 (i18n).
**Hito:** soporta crecimiento sin romperse.

> **Orden no negociable:** Fase 1 antes que Fase 2. No se puede cobrar legalmente sin la capa de cumplimiento. Y C-08.1 (migraciones versionadas) debe resolverse **antes** de tener clientes reales con datos en producción.

---

## 6. Riesgos clave

| Riesgo                               | Impacto                      | Mitigación                                                              |
| ------------------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| Comisión de tiendas (15-30%) en IAP  | Margen                       | Empujar suscripción anual; ofrecer upgrade vía web cuando sea permitido |
| `prisma db push` en prod             | Pérdida de datos de clientes | Migrar a `migrate deploy` antes de onboarding de clientes (C-08.1)      |
| Posicionamiento difuso ("super app") | Marketing                    | Foco en núcleo productividad; resto como Pro                            |
| Datos sensibles (finanzas + salud)   | Legal/seguridad              | Cifrado en reposo, minimización, asesoría legal (C-02.6)                |
| Sin iOS                              | 50% del mercado              | Priorizar C-09.3 una vez validada la monetización en Android/web        |
| Activación sin onboarding            | Churn temprano               | Fase 3 no es opcional                                                   |

---

## 7. Decisiones pendientes (para el dueño del producto)

1. **Reparto exacto Free vs Pro** — la tabla §3.1 es hipótesis; validar con conversión real.
2. **Precio y moneda** — definir mercado primario (¿LATAM con PPP? ¿USD global?).
3. **¿iOS desde el inicio o tras validar Android/web?** — afecta tiempo y costo (Apple Dev + revisión).
4. **Asesoría legal** — ToS/Privacidad y manejo de datos sensibles requieren revisión profesional, no plantilla genérica.
5. **¿Inglés en v1?** — depende del mercado objetivo.
