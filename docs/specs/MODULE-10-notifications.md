# SPEC-10: Notificaciones Push

**Tipo:** module
**Estado:** draft
**Dominio:** notificaciones y alertas
**Dependencias:** SPEC-01 (Auth), SPEC-03 (Hábitos), INTEGRATION-03 (Firebase Push)

---

## Objetivo

Enviar notificaciones push a los dispositivos del usuario para recordar el cumplimiento de hábitos, alertas de eventos próximos y otros avisos del sistema. Gestionar el registro y baja de tokens de dispositivo.

## Actores

- **Usuario autenticado**: registra/elimina tokens de dispositivo.
- **Sistema (cron)**: envía notificaciones programadas vía Firebase Cloud Messaging (FCM).

---

## Reglas de Negocio

1. Cada dispositivo se registra con un token FCM único global (`PushToken.token @unique`).
2. Un usuario puede tener múltiples tokens (multi-dispositivo: iOS, Android, Web).
3. Los tokens tienen plataforma: `IOS`, `ANDROID` o `WEB`.
4. Las notificaciones de hábitos se envían según la hora configurada en `NotificationSetting` (ver SPEC-03).
5. El sistema registra cada notificación enviada en el modelo `Notification` con su estado.
6. Las notificaciones de eventos se envían `reminderMinutes` antes del evento.
7. Los tokens expirados o inválidos se eliminan automáticamente al recibir error de FCM.

---

## Modelo de Datos

```prisma
model PushToken {
  id        String          @id @default(uuid())
  userId    String
  token     String          @unique
  platform  DevicePlatform  // IOS | ANDROID | WEB
  createdAt DateTime        @default(now())

  user      User            @relation(...)
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  body      String
  data      Json?
  sentAt    DateTime @default(now())
  read      Boolean  @default(false)

  user      User     @relation(...)
}

enum DevicePlatform { IOS ANDROID WEB }
```

---

## API Endpoints

**Base path:** `/api/push`

| Método   | Path                      | Descripción                         |
| -------- | ------------------------- | ----------------------------------- |
| `POST`   | `/register`               | Registrar token FCM del dispositivo |
| `DELETE` | `/unregister`             | Eliminar token FCM del dispositivo  |
| `GET`    | `/notifications`          | Listar notificaciones del usuario   |
| `PATCH`  | `/notifications/:id/read` | Marcar notificación como leída      |

---

## Criterios de Aceptación

- [ ] Al registrar un token ya existente, se actualiza en lugar de duplicar.
- [ ] Al desregistrar, el token se elimina permanentemente.
- [ ] Los errores FCM de token inválido provocan eliminación automática del token.
- [ ] Las notificaciones de hábitos respetan la hora configurada en `NotificationSetting`.
- [ ] Las notificaciones de eventos se envían `reminderMinutes` antes del inicio.
- [ ] Un usuario no puede ver notificaciones de otro usuario.
