# US-106: Configurar Push Notifications en Mobile (Expo Notifications)

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-106
**Título:** Configurar Push Notifications en Mobile (Expo Notifications)
**Tipo:** Mobile

## Descripción

Como usuario de la app móvil, quiero recibir notificaciones push cuando debo completar un hábito, para no olvidar mis objetivos del día.

## Razón

Los recordatorios de hábitos son esenciales para mantener el engagement diario. Sin notificaciones push, los usuarios olvidan revisar la app y abandonan sus objetivos.

## Criterios de Aceptación

### 1. Configuración de Expo Notifications

- [ ] Dependencias instaladas: expo-notifications, expo-device, expo-constants
- [ ] `app.json` configurado con plugin expo-notifications
- [ ] Icono y sonido de notificación configurados
- [ ] Modo: production

### 2. Configuración de Firebase

- [ ] Android:
  - `google-services.json` descargado y colocado en packages/mobile/
  - Package name: com.horus.app
- [ ] iOS:
  - `GoogleService-Info.plist` descargado y colocado en packages/mobile/ios/
  - Bundle ID: com.horus.app
  - Certificados de push configurados en Apple Developer

### 3. Servicio de Push Notifications Mobile

- [ ] Archivo `mobile/src/services/push-notifications.ts` creado
- [ ] Configuración de notificationHandler (foreground)
- [ ] Método registerForPushNotifications():
  - Verificar dispositivo físico
  - Solicitar permisos
  - Obtener Expo push token
  - Configurar canal Android
- [ ] Método sendTokenToBackend(token)
- [ ] Listeners: onNotificationReceived, onNotificationTapped
- [ ] Método clearBadge()

### 4. Hook para Inicializar Push Notifications

- [ ] Hook `usePushNotifications.ts` creado
- [ ] Registrar dispositivo al iniciar app
- [ ] Listener de notificaciones en foreground
- [ ] Listener de tap en notificación con deep linking
- [ ] Cleanup de listeners

### 5. Deep Linking

- [ ] Navegación al hábito específico cuando se toca notificación
- [ ] Highlight visual del hábito en la lista
- [ ] Scroll automático al hábito

### 6. Settings de Notificaciones

- [ ] Toggle en Settings para habilitar/deshabilitar
- [ ] Mostrar estado actual de permisos
- [ ] Link a settings del sistema si permisos denegados

### 7. Badge Count

- [ ] Actualizar badge con número de hábitos pendientes del día
- [ ] Limpiar badge al marcar todos completados

## Tareas Técnicas

- [ ] Instalar y configurar expo-notifications - [1.5h]
- [ ] Configurar Firebase en mobile (google-services.json, etc.) - [1h]
- [ ] Implementar PushNotificationManager - [2h]
- [ ] Crear hook usePushNotifications - [1h]
- [ ] Implementar deep linking - [1.5h]
- [ ] Implementar settings de notificaciones - [1h]
- [ ] Implementar badge count - [0.5h]
- [ ] Escribir tests - [2h]

## Componentes Afectados

- **mobile:** PushNotificationManager, usePushNotifications hook, Settings screen, Navigation

## Dependencias

- US-105 (Firebase configurado en backend)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
