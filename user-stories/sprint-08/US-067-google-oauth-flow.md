# US-067: OAuth2 Flow con Google Calendar

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-067
**Título:** OAuth2 Flow con Google Calendar

## Descripción

Como usuario, quiero conectar mi cuenta de Google para sincronizar mi calendario, para tener mis eventos de Google automáticamente en Horus.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/sync/google-calendar/connect` inicia OAuth2 flow:
  - Genera URL de autorización de Google
  - Incluye scopes: `calendar.events`, `calendar.readonly`
  - Devuelve URL para que mobile/web redirija
- [ ] Endpoint `GET /api/sync/google-calendar/callback` recibe código de autorización:
  - Intercambia código por access token y refresh token
  - Guarda tokens encrypted en SyncSetting
  - Set googleCalendarEnabled = true
  - Devuelve success con tokens (omitidos en response por seguridad)
- [ ] Endpoint `POST /api/sync/google-calendar/disconnect` desconecta:
  - Revoca tokens en Google
  - Elimina tokens de BD
  - Set googleCalendarEnabled = false
  - Marca eventos sincronizados como solo locales (syncWithGoogle = false)
- [ ] Endpoint `GET /api/sync/google-calendar/status` devuelve estado de conexión:
  - googleCalendarEnabled, lastSyncAt, nextSyncAt
  - Si hay error de sincronización, devuelve detalles
- [ ] Manejo automático de refresh de tokens:
  - Si access token expirado, usar refresh token para obtener nuevo
  - Actualizar googleAccessToken y googleTokenExpiresAt en BD
  - Retry request original con nuevo token
- [ ] Manejo de errores de OAuth:
  - Token revocado: marcar como desconectado, notificar al usuario
  - Permisos insuficientes: mostrar error específico
  - Rate limit de Google: implementar backoff exponencial

## Tareas Técnicas

- [ ] Crear proyecto en Google Cloud Console (manual) - [1h]
- [ ] Configurar OAuth consent screen - [0.5h]
- [ ] Crear credenciales OAuth 2.0 (client ID, secret) - [0.5h]
- [ ] Instalar googleapis library - [0.5h]
- [ ] Crear service `googleAuth.service.ts` - [3h]
- [ ] Implementar generateAuthUrl() - [1h]
- [ ] Implementar exchangeCodeForTokens() - [1.5h]
- [ ] Implementar refreshAccessToken() - [1.5h]
- [ ] Implementar revokeTokens() - [1h]
- [ ] Crear controller endpoints - [1.5h]
- [ ] Almacenar tokens encrypted en BD - [1h]
- [ ] Tests de OAuth flow (mock de Google API) - [3h]
- [ ] Documentación de setup de Google Cloud - [1h]

## Componentes Afectados

- **backend:** GoogleAuthService, SyncController, OAuth utilities

## Dependencias

- US-065 debe estar completa
- Cuenta de Google Cloud Console configurada

## Prioridad

critical

## Esfuerzo Estimado

8 Story Points
