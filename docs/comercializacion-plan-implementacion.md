# Horus — Plan de implementación (comercialización)

> Plan ejecutable derivado de [`comercializacion-analisis.md`](./comercializacion-analisis.md).
> Decisiones base: **núcleo productividad** · **freemium + suscripción** · B2C.
> Estructura: sprints de ~2 semanas. Cada tarea lista archivos reales a tocar, criterios de aceptación y dependencias.
> Última actualización: 2026-06-24

---

## Cómo leer este plan

- **Sprint S-01…S-08**: secuencia de ejecución. El orden importa: Fase 1 (legal/seguridad) antes que Fase 2 (cobro).
- **Tallas**: S ≈ 1-3 días, M ≈ 1 semana, L ≈ 2-3 semanas.
- **DoD global** por tarea: tests (Vitest backend / Jest mobile / Playwright web según aplique) + type-check (`pnpm type-check`) + lint en verde, y actualización de `CHANGELOG.md`.
- **Convención de ramas/commits**: conventional commits (ya en uso). Una rama por sprint o por épica.

### Infra ya existente que aprovechamos (no reinventar)

| Necesidad                           | Ya existe                      | Archivo                                              |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------- |
| Envío de email transaccional        | ✅ Resend + fallback dev       | `apps/backend/src/services/email.service.ts`         |
| Token con hash + expiración (molde) | ✅ `PasswordResetToken`        | `prisma/schema.prisma`                               |
| Auth + `req.user`                   | ✅ `authMiddleware` carga user | `apps/backend/src/middlewares/auth.middleware.ts`    |
| Microsoft auth (base)               | ⚠️ parcial                     | `apps/backend/src/services/microsoftAuth.service.ts` |
| Push (re-engagement)                | ✅ FCM                         | `push.routes.ts`                                     |
| Errores                             | ✅ Sentry + Winston            | `src/lib/sentry.ts`, `src/lib/logger.ts`             |

---

# FASE 1 — Legalmente vendible (P0)

Objetivo: cerrar agujeros de seguridad y cumplimiento para poder cobrar y publicar. **Sin dependencia de Stripe** — se puede ejecutar ya.

## Sprint S-01 · Roles + seguridad de cuenta — _M_

### S-01.1 · Rol de usuario y middleware admin _(S)_ — **C-01.1 / C-01.2**

- **Schema** (`prisma/schema.prisma`, modelo `User`): añadir `role Role @default(USER)` + `enum Role { USER ADMIN }`.
- **Migración**: `prisma migrate dev --name add_user_role` (ver S-07.1 sobre migrate vs db push; en local usar migrate).
- **Middleware** nuevo `src/middlewares/adminRole.middleware.ts`: exige `req.user.role === 'ADMIN'` → `ForbiddenError` si no.
- Añadir `role: true` al `select` de `auth.middleware.ts` y al tipo `req.user` (augmentation de Express).
- Aplicar a `admin.routes.ts` (quitar el `TODO`) y auditar otros endpoints sensibles.
- **Aceptación**: usuario normal recibe 403 en `/api/admin/*`; admin pasa. Test de integración con ambos roles.

### S-01.2 · Auditoría de aislamiento por `userId` _(M)_ — **C-01.3**

- Revisar cada controller/service: confirmar que filtran por `req.user.id`, **no** por id recibido en el body/query.
- Foco en endpoints que reciben `userId` o ids de recursos: validar ownership antes de leer/escribir.
- **Aceptación**: test que intenta acceder a recurso de otro usuario → 404/403. Checklist de endpoints firmado en el PR.

### S-01.3 · Verificación de email _(M)_ — **C-03.1**

- **Schema**: modelo `EmailVerificationToken` (clonar estructura de `PasswordResetToken`) + `emailVerifiedAt DateTime?` en `User`.
- **Service** (`auth.service.ts`): generar token al registrar; `verifyEmail(token)`; reenviar.
- **Email**: plantilla vía `email.service.ts` (Resend ya configurado).
- **Rutas**: `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`.
- **Política**: definir si verify es bloqueante para login o solo para Pro/acciones sensibles (recomendado: no bloquea login, sí marca cuenta y se exige antes de pagar).
- **Web/Mobile**: pantalla "verifica tu correo" + banner.
- **Aceptación**: registro → email con link → verify marca `emailVerifiedAt`. Token expira y es de un solo uso.

### S-01.4 · Endurecimiento de auth _(S)_ — **C-03.2 / C-03.3**

- Rate-limit específico en login / reset / resend (express-rate-limit ya está en el proyecto).
- Lockout temporal tras N intentos fallidos de login.
- Revisar `.gitignore` para `.env`; documentar rotación de `JWT_SECRET`.
- **Aceptación**: tras N fallos, login bloqueado X minutos; test de rate-limit.

---

## Sprint S-02 · Cumplimiento legal y privacidad — _L_

### S-02.1 · Export de datos del usuario _(M)_ — **C-02.3**

- **Service** `src/services/dataExport.service.ts`: arma JSON con todas las entidades del usuario (recorrer relaciones de `User`).
- **Ruta** `GET /api/account/export` → archivo descargable (JSON; CSV opcional v2).
- Proceso async si el volumen es grande (job + email con link); v1 puede ser síncrono.
- **Aceptación**: usuario descarga su data completa; no incluye datos de otros usuarios.

### S-02.2 · Borrado real de cuenta _(M)_ — **C-02.4**

- **Service** `src/services/accountDeletion.service.ts`: borrado en cascada / anonimización (respeta `onDelete: Cascade` ya definido en relaciones).
- Confirmación fuerte (re-auth o escribir "ELIMINAR"); periodo de gracia opcional (soft → hard tras X días).
- **Ruta** `DELETE /api/account` + UI en web y mobile (Ajustes → Cuenta).
- **Aceptación**: tras borrado, login imposible y datos eliminados/anonimizados; verificación en DB.

### S-02.3 · Términos, Privacidad y consentimiento _(M)_ — **C-02.1 / C-02.2**

- Documentos legales (con asesoría — ver decisiones pendientes del análisis).
- **Schema**: `acceptedTermsVersion` + `acceptedTermsAt` en `User`.
- Checkbox de aceptación en registro (web + mobile); registrar versión.
- Páginas públicas `/terms` y `/privacy` (web) + links en mobile.
- **Aceptación**: no se puede registrar sin aceptar; queda registrada la versión.

### S-02.4 · Retención y datos sensibles _(S→L)_ — **C-02.5 / C-02.6**

- Política de retención + purga de cuentas inactivas (cron, ya hay node-cron).
- Evaluación de cifrado en reposo para campos financieros/salud (decidir alcance v1 vs v2).
- **Aceptación**: documento de retención + job de purga con dry-run.

---

# FASE 2 — Monetizable (P1)

Objetivo: que un usuario pueda pagar y desbloquear Pro. Depende de Fase 1 (verify email + legal).

## Sprint S-03 · Modelo de suscripción + entitlements — _L_

### S-03.1 · Schema de suscripción _(M)_ — **C-04.1**

- **Modelos**: `Subscription` (`userId`, `plan`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `provider` STRIPE|GOOGLE_PLAY|APP_STORE, `providerSubscriptionId`), `enum Plan { FREE PRO }`, `enum SubStatus { TRIALING ACTIVE PAST_DUE CANCELED EXPIRED }`.
- Relación 1:1 con `User`; usuario sin `Subscription` = FREE por defecto.
- **Aceptación**: migración aplicada; usuario nuevo resuelve a plan FREE.

### S-03.2 · Servicio central de entitlements _(M)_ — **C-05.1 / C-05.2**

- `src/services/entitlements.service.ts`: `getPlan(userId)`, `canUse(userId, feature)`, `getLimits(plan)`.
- Tabla de límites por plan (config central, ver §3.1 del análisis: máx hábitos, metas, sync calendario, etc.).
- **Middleware** `requireFeature(feature)` para gatear rutas; helper para límites de cantidad.
- **Aceptación**: usuario FREE bloqueado al superar límite (p. ej. 6º hábito → 402/403 con código de paywall); usuario PRO sin límite. Tests por feature.

## Sprint S-04 · Stripe (web) — _L_

### S-04.1 · Integración Stripe _(L)_ — **C-04.2**

- Checkout (suscripción mensual/anual + trial), Customer Portal (gestión/cancelar).
- **Webhooks** `POST /api/billing/webhook`: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed` → actualizar `Subscription`.
- Reconciliación: el webhook es la fuente de verdad del `status`.
- **Aceptación**: pago en test mode activa PRO; cancelación vuelve a FREE al fin del periodo; pago fallido → PAST_DUE.

### S-04.2 · Pricing + gestión de suscripción (web) _(M)_ — **C-05.4**

- Página de pricing, flujo upgrade/downgrade/cancelar, banner de estado (trial restante, past_due).
- **Aceptación**: flujo completo free→pro→cancelar desde la web.

## Sprint S-05 · Compras in-app móvil — _L_

### S-05.1 · IAP Google Play _(L)_ — **C-04.3 / C-04.4**

- Suscripciones IAP (obligatorio en móvil; **no** Stripe dentro de la app).
- Verificación server-side de recibos + webhook/RTDN → mismo `Subscription`.
- Reconciliación Stripe ↔ IAP: un usuario, un entitlement (definir precedencia).
- **Aceptación**: compra IAP en sandbox activa PRO en backend; estado consistente con web.
- _Nota_: App Store IAP queda en Fase 4 junto con el build iOS (S-08).

### S-05.2 · Paywalls y gating UI (web + mobile) _(M)_ — **C-05.3**

- Paywalls contextuales en puntos de bloqueo (al tocar feature Pro o superar límite).
- **Aceptación**: estados de bloqueo claros con CTA a upgrade en ambas plataformas.

---

# FASE 3 — Convertible (P1)

Objetivo: funnel free→pro medible y optimizable.

## Sprint S-06 · Onboarding + analítica — _L_

### S-06.1 · Onboarding y estados vacíos _(M)_ — **C-06**

- Wizard de primer uso (elegir foco; crear 1er hábito/tarea/meta).
- Plantillas y datos de ejemplo; estados vacíos accionables por módulo.
- **Aceptación**: usuario nuevo llega a "primer valor" sin fricción; medible.

### S-06.2 · Analítica de producto _(M)_ — **C-07**

- PostHog/Amplitude en web + mobile: activación, retención D1/D7/D30, funnel free→trial→pro.
- Re-engagement con FCM (rachas en riesgo, recordatorios).
- **Aceptación**: dashboard de funnel y retención operativo.

---

# FASE 4 — Escalable (P2)

## Sprint S-07 · Operación y confiabilidad — _L_

### S-07.1 · Migraciones versionadas en prod _(M)_ — **C-08.1** — ⚠️ CRÍTICO

- Migrar de `prisma db push` a `migrate deploy`. Memoria del proyecto: Railway no soporta shadow DB para `migrate dev` → estrategia: generar migraciones en local con DB shadow propia y aplicar con `migrate deploy` en CI/Railway.
- **Debe resolverse ANTES de tener clientes reales con datos en prod.**
- **Aceptación**: pipeline aplica migraciones versionadas; baseline de la DB actual creado.

### S-07.2 · Backups, uptime y soporte _(M)_ — **C-08.2 / C-08.3 / C-08.5**

- Backups verificados + restore probado; monitoreo de uptime + página de estado.
- Centro de ayuda/FAQ + canal de soporte + feedback in-app.

## Sprint S-08 · Distribución móvil completa — _L_

### S-08.1 · Release Android publicable _(S)_ — **C-09.1 / C-09.2**

- Keystore de producción (reemplazar `debug.keystore`), ficha Play Store, data safety form, URL de privacidad (de S-02.3).

### S-08.2 · Build iOS + App Store _(L)_ — **C-09.3 / C-09.4**

- Cuenta Apple Developer, build iOS (Expo), IAP App Store, revisión.
- Documentar deuda técnica de New Arch desactivada.

## Sprint S-09 · i18n _(opcional según mercado)_ — **C-10**

---

## Dependencias y ruta crítica

```
S-01 (roles+verify) ─┐
S-02 (legal+export)  ├─► S-03 (entitlements) ─► S-04 (Stripe) ─► S-05 (IAP) ─► S-06 (onboarding+analítica)
                     │                                                              │
S-07.1 (migraciones) ◄── debe completarse antes de onboarding real de clientes ────┘
```

- **No empezar S-04 sin S-03** (Stripe necesita el modelo de `Subscription` y entitlements).
- **No hacer onboarding de clientes reales sin S-07.1** (riesgo de pérdida de datos con `db push`).
- S-01 y S-02 pueden ir en paralelo si hay dos personas.

---

## Arranque inmediato (sin bloqueos externos)

Lo que se puede empezar **hoy**, sin cuentas de Stripe/Apple/legal:

1. **S-01.1** — rol + `adminRole.middleware` (cierra el agujero de `/api/admin`). ~1 día.
2. **S-01.2** — auditoría de aislamiento por `userId`. ~2-3 días.
3. **S-01.3** — verify email (reusa Resend + molde `PasswordResetToken`). ~1 semana.

> Recomendación: **arrancar por S-01.1** — es el de mayor ratio riesgo-cerrado / esfuerzo (agujero de seguridad real, ~1 día).

---

## Decisiones que desbloquean ejecución

1. ¿Verify email **bloquea login** o solo se exige antes de pagar? (afecta S-01.3)
2. ¿Borrado de cuenta inmediato o con **periodo de gracia**? (S-02.2)
3. **Stripe**: ¿alta de cuenta y productos lista? (bloquea S-04)
4. ¿iOS en esta tanda o tras validar Android/web? (S-08)
5. Asesoría legal para ToS/Privacidad (S-02.3) — externo, iniciar temprano.
