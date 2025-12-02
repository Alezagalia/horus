# US-118: Integración de Google Calendar en Web

**Sprint:** 13 - Frontend Web Completo
**ID:** US-118
**Título:** Integración de Google Calendar en Web
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero sincronizar mi Google Calendar desde el navegador, para ver todos mis eventos en un solo lugar sin usar la app móvil.

## Razón

La sincronización con Google Calendar es una feature clave que permite a los usuarios centralizar su agenda y evitar duplicar eventos manualmente.

## Criterios de Aceptación

### 1. Sección "Integraciones" en CalendarPage

- [ ] Icono engranaje en header
- [ ] Abre modal/sección de Google Calendar Sync

### 2. Modal de Google Calendar Sync

#### Estado "No conectado":

- [ ] Mensaje: "Conecta tu cuenta de Google para sincronizar eventos"
- [ ] Botón "Conectar Google Calendar"

#### Estado "Conectado":

- [ ] Mensaje: "✓ Conectado como {email}"
- [ ] Fecha de última sincronización
- [ ] Botón "Sincronizar Ahora"
- [ ] Botón "Desconectar"

### 3. Flujo de Conexión OAuth

- [ ] Click en "Conectar" → abre popup de Google OAuth
- [ ] Usuario autoriza permisos (calendar.readonly o calendar.events)
- [ ] Callback URL: /calendar/google-callback
- [ ] Guardar accessToken y refreshToken en backend
- [ ] Cerrar popup y actualizar estado

### 4. Sincronización Manual

- [ ] Botón "Sincronizar Ahora"
- [ ] Mostrar spinner mientras sincroniza
- [ ] Toast de éxito: "X eventos sincronizados"
- [ ] Actualizar calendario

### 5. Eventos de Google Calendar

- [ ] Badge distintivo "Google"
- [ ] Color diferenciado (azul Google)
- [ ] No editables desde Horus (mostrar mensaje)
- [ ] Eliminables (con advertencia)

### 6. Integración con Endpoints

- [ ] POST /api/google/calendar/auth
- [ ] GET /api/google/calendar/callback?code=XXX
- [ ] POST /api/google/calendar/sync
- [ ] DELETE /api/google/calendar/disconnect

### 7. Manejo de Errores

- [ ] Token expirado: mostrar botón "Reconectar"
- [ ] Error de sincronización: mostrar mensaje + "Reintentar"
- [ ] Permisos insuficientes: mostrar instrucciones

### 8. Seguridad

- [ ] OAuth popup con `rel="noopener noreferrer"`
- [ ] Validar state parameter (CSRF protection)

## Tareas Técnicas

- [ ] Crear componente GoogleCalendarSyncModal - [2h]
- [ ] Implementar OAuth flow con popup - [3h]
- [ ] Crear página de callback - [1.5h]
- [ ] Integrar con endpoints de Google Calendar - [2h]
- [ ] Implementar distinción visual de eventos - [1h]
- [ ] Implementar botón "Sincronizar Ahora" - [1h]
- [ ] Manejo de errores - [1.5h]
- [ ] Tests de componentes - [2h]
- [ ] Tests E2E de OAuth flow - [2h]

## Componentes Afectados

- **web:** GoogleCalendarSyncModal, OAuth flow, Calendar page

## Dependencias

- US-117 (Calendario debe estar implementado)
- Sprint 8 completado (endpoints de Google Calendar)
- Configuración de Google OAuth Client ID

## Prioridad

medium

## Esfuerzo Estimado

6 Story Points
