# Google Play IAP (S-05) — guía de puesta en marcha

El código de compras in-app (mobile) y su verificación server-side ya está
implementado. Para que funcione en vivo hace falta configurar Google Play y el
backend. Esta guía lista los pasos manuales (no se pueden automatizar desde el
repo) y dónde encaja cada credencial.

## Arquitectura

```
App (react-native-iap)  ──compra──▶  Google Play Billing
        │  purchaseToken
        ▼
POST /api/billing/google/verify  ──▶  Play Developer API (verifica + acknowledge)
        │                                   │
        └────────── upsert Subscription ◀───┘   (provider = GOOGLE_PLAY)

Renovaciones / cancelaciones / refunds:
Google  ──RTDN──▶  Pub/Sub topic  ──push──▶  POST /api/billing/google/rtdn?secret=…
```

- Cliente: `apps/mobile/src/hooks/useProPurchase.ts`, productos en
  `apps/mobile/src/config/billing.ts`.
- Backend: `apps/backend/src/services/googlePlay.service.ts`, endpoints en
  `apps/backend/src/routes/billing.routes.ts`.

## 1. Play Console — producto de suscripción

1. Subí al menos una build firmada a un track (Internal testing alcanza).
2. **Monetize → Subscriptions → Create subscription**. Creá la suscripción Pro
   con dos base plans (mensual y anual) o dos productos separados.
3. Los **product ids** deben coincidir en los tres lados:
   - Play Console (el id de la suscripción / base plan que el cliente pide),
   - `EXPO_PUBLIC_IAP_PRO_MONTHLY` / `EXPO_PUBLIC_IAP_PRO_ANNUAL` (mobile),
   - `GOOGLE_PLAY_PRODUCT_PRO_MONTHLY` / `_ANNUAL` (backend).
     Por defecto usamos `pro_monthly` y `pro_annual`.
4. Activá la suscripción.

## 2. Cuenta de servicio (verificación server-side)

1. Play Console → **Setup → API access** → vinculá o creá un proyecto de Google
   Cloud y una **service account**.
2. Otorgá a esa service account el permiso para **ver datos financieros /
   gestionar pedidos y suscripciones** (Android Publisher).
3. En Google Cloud, generá una **clave JSON** de la service account.
4. Pegá el JSON **en una sola línea** en `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
5. Seteá `GOOGLE_PLAY_PACKAGE_NAME="com.horus.app"`.

> Sin estas dos vars, `/api/billing/google/verify` responde **503** (billing
> inactivo) y la app no rompe.

## 3. RTDN (notificaciones en tiempo real)

1. En Google Cloud creá un **topic de Pub/Sub** (p. ej. `horus-rtdn`).
2. Dale permiso de **Publisher** a la cuenta de Google Play
   (`google-play-developer-notifications@system.gserviceaccount.com`).
3. En Play Console → **Monetization setup → Real-time developer notifications**:
   pegá el nombre del topic y enviá una _test notification_.
4. Creá una **suscripción push** en el topic apuntando a:
   `https://<TU_BACKEND>/api/billing/google/rtdn?secret=<GOOGLE_PLAY_RTDN_SECRET>`
5. Generá un secreto random y ponelo en `GOOGLE_PLAY_RTDN_SECRET` (mismo valor en
   la URL del push). El endpoint rechaza con 401 si el secreto no coincide.

## 4. Build de la app

- `react-native-iap@^12` ya está en `apps/mobile/package.json` y el config plugin
  `react-native-iap` (Play Store) en `app.json` agrega el permiso
  `com.android.vending.BILLING`.
- Regenerá el proyecto nativo y compilá: `expo prebuild` (si aplica) y luego el
  build local `cd android && ./gradlew :app:assembleRelease`.
- IAP **no funciona en Expo Go** ni en emuladores sin Google Play; probá con un
  build firmado y una cuenta de **license tester** (Play Console → Setup →
  License testing) para no cobrar de verdad.

## 5. Activar enforcement

Cuando billing esté probado, encendé `BILLING_ENFORCED="true"` para que los
límites Free/Pro empiecen a aplicar. Hasta entonces el middleware es no-op y
todos siguen como FREE sin bloqueos.

## Notas

- La fuente de verdad del plan es la tabla `Subscription`; `verify` y RTDN la
  mantienen al día. `entitlements.resolvePlan` decide PRO/FREE según estado +
  período (un CANCELED conserva Pro hasta que vence).
- El backend rechaza tokens de productos que no vendemos
  (`GOOGLE_PLAY_PRODUCT_PRO_*`) para que un token de otro SKU no otorgue Pro.
