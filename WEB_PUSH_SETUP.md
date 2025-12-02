# 🌐 Web Push Notifications Setup Guide

## Sprint 12 - US-107

Esta guía explica cómo configurar Web Push Notifications con VAPID keys.

---

## 📋 Prerrequisitos

- Backend corriendo (apps/backend)
- Web app corriendo (apps/web)
- Navegador moderno con soporte para Service Workers y Push API

---

## 🔑 Paso 1: Generar VAPID Keys

Las VAPID keys son necesarias para identificar tu aplicación ante el servicio de push del navegador.

### Opción A: Usar web-push CLI

```bash
cd apps/backend
npx web-push generate-vapid-keys
```

Esto generará algo como:

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkr...

Private Key:
bdSiGcguMYlUYvvfQhGKZBoqQXS1Jm76...

=======================================
```

### Opción B: Online Generator

Visita: https://vapidkeys.com/ y genera un par de keys.

---

## 🔧 Paso 2: Configurar Variables de Entorno

Agrega las keys a `apps/backend/.env`:

```env
# Web Push VAPID Keys (Sprint 12 - US-107)
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkr...
VAPID_PRIVATE_KEY=bdSiGcguMYlUYvvfQhGKZBoqQXS1Jm76...
```

⚠️ **IMPORTANTE**:

- NO commitees las keys al repositorio
- Las keys son sensibles - trátulas como passwords
- Usa diferentes keys para dev/staging/production

---

## 📁 Paso 3: Configurar Service Worker

El service worker ya está creado en `apps/web/public/service-worker.js`.

Asegúrate de que Vite esté configurado para copiar archivos de `public/` al build:

**vite.config.ts**:

```typescript
export default defineConfig({
  publicDir: 'public', // Vite copiará automáticamente
  // ...
});
```

---

## 🚀 Paso 4: Integrar en la Aplicación Web

### En tu Layout o App.tsx:

```typescript
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';

function App() {
  return (
    <div>
      {/* Tu app */}

      {/* Prompt flotante de notificaciones */}
      <NotificationPermissionPrompt
        onResponse={(granted) => {
          console.log('Notifications:', granted ? 'enabled' : 'disabled');
        }}
      />
    </div>
  );
}
```

---

## 🧪 Paso 5: Testing

### 1. Verificar Service Worker

Abre DevTools → Application → Service Workers

Deberías ver el service worker registrado.

### 2. Verificar Subscription

```javascript
// En la consola del navegador
navigator.serviceWorker.ready.then(async (reg) => {
  const sub = await reg.pushManager.getSubscription();
  console.log('Subscription:', sub);
});
```

### 3. Enviar Notificación de Prueba

Desde el backend:

```bash
curl -X POST http://localhost:3001/api/push/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test from web push"
  }'
```

O usa el hook en la UI:

```typescript
import { useWebPushNotifications } from '@/hooks/useWebPushNotifications';

function Settings() {
  const { requestPermission, isSupported } = useWebPushNotifications();

  return (
    <button onClick={requestPermission} disabled={!isSupported}>
      Enable Notifications
    </button>
  );
}
```

---

## 🔍 Verificación de Compatibilidad

### Navegadores Soportados:

- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 79+
- ✅ Opera 37+
- ✅ Samsung Internet 5+
- ❌ Safari (desktop) - NO soportado
- ⚠️ Safari (iOS 16.4+) - Soporte limitado

### Verificar en runtime:

```typescript
const { isSupported } = useWebPushNotifications();

if (!isSupported) {
  console.log('Web Push not supported in this browser');
}
```

---

## 🐛 Troubleshooting

### Problema: "Service Worker registration failed"

**Solución**:

- Verifica que `service-worker.js` esté en `/public/`
- En producción, el SW debe servirse desde la raíz (`/`)
- HTTPS es requerido (excepto en localhost)

---

### Problema: "Failed to get VAPID public key"

**Solución**:

- Verifica que `VAPID_PUBLIC_KEY` esté en `.env`
- Reinicia el backend después de agregar las keys
- Verifica que el endpoint `/api/push/vapid-public-key` responda

```bash
curl http://localhost:3001/api/push/vapid-public-key
```

---

### Problema: "Push subscription failed"

**Posibles causas**:

1. VAPID key inválida
2. Permisos de notificaciones denegados
3. Service worker no registrado
4. Navegador no soportado

**Verificar**:

```javascript
// Check permission
console.log('Permission:', Notification.permission);

// Check SW
navigator.serviceWorker.getRegistration().then((reg) => {
  console.log('SW:', reg);
});
```

---

### Problema: "Notifications not arriving"

**Checklist**:

- [ ] Backend está corriendo
- [ ] VAPID keys configuradas correctamente
- [ ] Firebase configurado (US-105)
- [ ] Subscription registrada en backend (tabla `PushToken`)
- [ ] Permisos de notificaciones otorgados
- [ ] Navegador permite notificaciones (no en modo DND)

---

## 📊 Monitoreo

### Ver Subscriptions en Base de Datos:

```sql
SELECT * FROM push_tokens WHERE platform = 'WEB';
```

### Logs del Service Worker:

DevTools → Application → Service Workers → "Update on reload"

Luego recarga la página y mira la consola.

---

## 🔐 Seguridad

### Best Practices:

1. **VAPID Keys**:
   - Genera nuevas keys para cada ambiente
   - Rota keys periódicamente
   - NO commitees al repo

2. **HTTPS Requerido**:
   - Service Workers solo funcionan en HTTPS
   - Excepción: `localhost` para desarrollo

3. **Subscription Endpoint**:
   - Es único por navegador/dispositivo
   - Trátalo como token sensible
   - Invalida subscriptions viejas

4. **Autenticación**:
   - Endpoint `/register` requiere auth
   - Solo el usuario puede registrar su subscription
   - Endpoint `/vapid-public-key` es público (necesario)

---

## 📚 Referencias

- [Web Push API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker Docs](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Spec](https://datatracker.ietf.org/doc/html/rfc8292)
- [Can I Use - Push API](https://caniuse.com/push-api)

---

## ✅ Checklist de Setup Completo

- [ ] VAPID keys generadas
- [ ] Variables de entorno configuradas en backend
- [ ] Backend reiniciado
- [ ] Service worker en `/public/service-worker.js`
- [ ] Hook `useWebPushNotifications` creado
- [ ] Componente `NotificationPermissionPrompt` agregado a UI
- [ ] Endpoint `/api/push/vapid-public-key` funciona
- [ ] Endpoint `/api/push/register` funciona
- [ ] Permisos solicitados al usuario
- [ ] Subscription enviada al backend
- [ ] Notification de prueba recibida
- [ ] Deep linking funciona al hacer click

---

**¡Listo para recibir notificaciones web!** 🎉
