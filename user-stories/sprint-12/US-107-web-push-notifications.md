# US-107: Web Push Notifications con Service Worker

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-107
**Título:** Web Push Notifications con Service Worker
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero recibir notificaciones push en mi navegador, para no olvidar mis hábitos incluso cuando la app no está abierta.

## Razón

Las notificaciones web permiten mantener el engagement de usuarios que prefieren trabajar desde desktop, igualando la experiencia de las apps móviles.

## Criterios de Aceptación

### 1. Service Worker para Web Push

- [ ] Archivo `public/service-worker.js` creado
- [ ] Event listeners: install, activate, push, notificationclick
- [ ] Manejo de notificaciones recibidas
- [ ] Deep linking al hacer click en notificación
- [ ] Opciones de notificación: body, icon, badge, vibrate, actions

### 2. Hook para Web Push

- [ ] Hook `useWebPushNotifications.ts` creado
- [ ] Verificar soporte de navegador
- [ ] Registrar service worker
- [ ] Método requestPermission()
- [ ] Método subscribe() con VAPID keys
- [ ] Método unsubscribe()
- [ ] Estado: permission, subscription, isSupported

### 3. Componente de Solicitud de Permisos

- [ ] Componente `NotificationPermissionPrompt.tsx`
- [ ] Card flotante en esquina inferior derecha
- [ ] Mostrar solo si permission='default' y isSupported
- [ ] Botones: "Habilitar", "Más tarde"
- [ ] Auto-ocultar si usuario ya aceptó o rechazó

### 4. API Routes

- [ ] Route `GET /api/push/vapid-public-key`:
  - Retorna VAPID public key
- [ ] Route `POST /api/push/register`:
  - Acepta web push subscription
  - Registra endpoint como token único

### 5. VAPID Keys

- [ ] Generar keys con `npx web-push generate-vapid-keys`
- [ ] Guardar en .env:
  - VAPID_PUBLIC_KEY
  - VAPID_PRIVATE_KEY

## Tareas Técnicas

- [ ] Crear service-worker.js - [1.5h]
- [ ] Implementar useWebPushNotifications hook - [2h]
- [ ] Crear NotificationPermissionPrompt component - [1h]
- [ ] Crear API routes (vapid-public-key, register) - [1h]
- [ ] Generar y configurar VAPID keys - [0.5h]
- [ ] Integrar en dashboard layout - [0.5h]
- [ ] Escribir tests - [1.5h]

## Componentes Afectados

- **web:** Service Worker, useWebPushNotifications hook, NotificationPermissionPrompt, API routes

## Dependencias

- US-105 (Backend push configurado)
- Sprint 11 (Frontend web)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
