# US-105: Configurar Firebase Cloud Messaging (FCM) en Backend + Modelo de Datos

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-105
**Título:** Configurar Firebase Cloud Messaging (FCM) en Backend + Modelo de Datos
**Tipo:** Backend

## Descripción

Como desarrollador backend, quiero configurar Firebase Cloud Messaging (FCM) y el modelo de datos de tokens de dispositivos, para tener la infraestructura necesaria para enviar notificaciones push a mobile y web.

## Razón

El sistema de notificaciones push es el driver #1 de retención en apps de productividad. Sin esta infraestructura, no podemos enviar recordatorios críticos que mantengan el engagement diario de usuarios.

## Criterios de Aceptación

### 1. Firebase Cloud Messaging Setup

- [ ] Proyecto de Firebase creado en Firebase Console:
  - Nombre: "Horus Production"
  - Analytics habilitado para tracking
  - Cloud Messaging API habilitado
- [ ] Firebase Admin SDK configurado en backend:
  - `npm install firebase-admin`
  - Service account JSON descargado desde Firebase Console
  - Credentials almacenados en .env (NUNCA en código)
  - Inicialización en `src/lib/firebase-admin.ts`
- [ ] Environment variables configuradas:
  ```bash
  FIREBASE_PROJECT_ID=horus-prod
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk@horus-prod.iam.gserviceaccount.com
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
  ```

### 2. Modelo de Datos - PushToken

- [ ] Modelo `PushToken` creado en Prisma schema con enum DevicePlatform (IOS, ANDROID, WEB)
- [ ] Campos: id, userId, token (unique), platform, deviceName, deviceId, appVersion, active, lastUsedAt
- [ ] Relación User actualizada con pushTokens y notificationPreferences
- [ ] Migración de Prisma ejecutada exitosamente
- [ ] Índices en userId+active y token

### 3. Modelo de Datos - Actualizar Notification

- [ ] Modelo `Notification` ampliado con campos: pushSent, pushSentAt, pushError

### 4. Servicio PushNotificationService

- [ ] Servicio creado en `src/services/push/push-notification.service.ts`
- [ ] Método registerToken(userId, token, platform, deviceInfo)
- [ ] Método unregisterToken(token)
- [ ] Método sendToUser(input: SendPushInput)
- [ ] Método sendScheduledHabitReminder(habitId, userId)
- [ ] Manejo de tokens inválidos (desactivar automáticamente)
- [ ] Logging de errores y éxitos

### 5. API Endpoints

- [ ] Endpoint `POST /api/push/register`:
  - Body: `{ token, platform, deviceName?, deviceId?, appVersion? }`
  - Registra o actualiza token de dispositivo
  - Validación con Zod schema
- [ ] Endpoint `POST /api/push/unregister`:
  - Body: `{ token }`
  - Desactiva token (soft delete)
- [ ] Endpoint `POST /api/push/test` (solo desarrollo):
  - Envía notificación de prueba
  - Protegido con auth admin

### 6. Integración con sistema de notificaciones existente (Sprint 4)

- [ ] Servicio unificado que envía tanto SSE como Push
- [ ] Guardar en BD + enviar SSE + enviar push
- [ ] Actualizar notificación con info del push (pushSent, pushSentAt)

## Tareas Técnicas

- [ ] Crear proyecto en Firebase Console - [0.5h]
- [ ] Descargar service account JSON y configurar .env - [0.5h]
- [ ] Instalar firebase-admin SDK - [0.5h]
- [ ] Crear modelos PushToken y actualizar Notification - [1h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Implementar PushNotificationService - [2h]
- [ ] Crear endpoints de API - [1.5h]
- [ ] Integrar con notificationService existente - [1h]
- [ ] Escribir tests unitarios - [2h]

## Componentes Afectados

- **backend:** Firebase Admin SDK, PushNotificationService, API endpoints, Prisma models

## Dependencias

- Modelo Notification del Sprint 4

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
