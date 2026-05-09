# SPEC-I03: Firebase Cloud Messaging (Push Notifications)

**Tipo:** integration
**Estado:** draft
**Dependencias:** SPEC-01 (Auth), SPEC-10 (Notificaciones)

---

## Objetivo

Enviar notificaciones push a dispositivos iOS, Android y Web mediante Firebase Cloud Messaging (FCM), usando Firebase Admin SDK en el backend.

## Actores

- **Sistema (backend)**: envía notificaciones mediante FCM Admin SDK.
- **Sistema (cron)**: dispara el envío de notificaciones programadas (hábitos, eventos).
- **Cliente mobile/web**: recibe notificaciones mediante `expo-notifications` o service worker.

---

## Reglas de Negocio

1. El backend usa Firebase Admin SDK para enviar notificaciones (no el SDK cliente).
2. Las credenciales de Firebase se configuran como variable de entorno (`FIREBASE_SERVICE_ACCOUNT`).
3. Al enviar a múltiples dispositivos de un mismo usuario, se itera sobre sus `PushToken[]`.
4. Los tokens FCM inválidos (error `messaging/registration-token-not-registered`) se eliminan automáticamente de la BD.
5. Las notificaciones de hábitos se procesan por un cron que verifica las `NotificationSetting` activas.
6. Las notificaciones de eventos se procesan por un cron que verifica eventos con `reminderMinutes` configurado y `notificationSent = false`.
7. Una vez enviada la notificación de un evento, se marca `notificationSent = true`.

---

## Arquitectura de envío

```
Cron job (node-cron)
  ↓
Consulta NotificationSetting / Events con reminder pendiente
  ↓
Firebase Admin SDK → FCM
  ↓
Dispositivo (expo-notifications / service worker)
```

---

## Payload de notificación

```json
{
  "notification": {
    "title": "string",
    "body": "string"
  },
  "data": {
    "type": "habit | event | task",
    "entityId": "uuid",
    "screen": "HabitDetail | EventDetail | TaskDetail"
  }
}
```

---

## Configuración en clientes

### Mobile (Expo)

- Librería: `expo-notifications`
- Token: `Notifications.getExpoPushTokenAsync()` en desarrollo / `getDevicePushTokenAsync()` en producción
- El token se envía al backend con `POST /api/push/register`

### Web

- Service Worker con Firebase Messaging SDK
- Token registrado con `POST /api/push/register` y `platform = WEB`

---

## Criterios de Aceptación

- [ ] Las credenciales de Firebase no están hardcodeadas; se cargan desde variables de entorno.
- [ ] Un token inválido se elimina de la BD automáticamente al recibir el error de FCM.
- [ ] El cron de hábitos no envía notificaciones duplicadas en el mismo día.
- [ ] El cron de eventos marca `notificationSent = true` tras enviar exitosamente.
- [ ] Los errores de FCM se loguean (Winston) sin romper el flujo de la aplicación.
- [ ] El `data` del payload permite al cliente navegar a la pantalla correcta al abrir la notificación.
