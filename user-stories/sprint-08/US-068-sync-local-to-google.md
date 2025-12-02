# US-068: Sincronización Local → Google (Exportar)

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-068
**Título:** Sincronización Local → Google (Exportar)

## Descripción

Como usuario, quiero que los eventos que creo en Horus se sincronicen automáticamente con Google Calendar, para verlos en todas mis aplicaciones de calendario.

## Criterios de Aceptación

- [ ] Al crear evento con syncWithGoogle = true:
  - Verificar autenticación con Google (tokens válidos)
  - Convertir evento a formato Google Calendar API
  - POST a Google Calendar API: `calendar.events.insert`
  - Guardar googleEventId en BD
  - Si hay error, marcar evento para reintento (retryCount, nextRetryAt)
- [ ] Al actualizar evento local:
  - Si tiene googleEventId: actualizar en Google con PUT
  - Enviar solo campos modificados
  - Manejar conflictos (last-write-wins por timestamp)
- [ ] Al eliminar evento local:
  - Si tiene googleEventId: eliminar en Google con DELETE
  - Para eventos recurrentes: manejar eliminación de instancia vs todas
- [ ] Manejo de errores:
  - Si evento no existe en Google (404): actualizar googleEventId = null
  - Si hay error de red: queue para reintento (exponential backoff)
  - Si rate limit (429): esperar tiempo indicado en header Retry-After
  - Si token inválido (401): intentar refresh, sino marcar como desconectado
- [ ] Conversión de formato:
  - Mapear campos de Event a formato de Google Calendar
  - Convertir timezone a UTC para startDateTime/endDateTime
  - Mapear RRULE correctamente (compatibilidad RFC 5545)
  - Mapear reminderMinutes a reminders de Google

## Tareas Técnicas

- [ ] Crear service `googleCalendarSync.service.ts` - [2h]
- [ ] Implementar createGoogleEvent(event) - [2h]
- [ ] Implementar updateGoogleEvent(event) - [1.5h]
- [ ] Implementar deleteGoogleEvent(eventId) - [1h]
- [ ] Implementar conversión de formato (local → Google) - [2h]
- [ ] Implementar queue de reintentos con bull o agenda - [2h]
- [ ] Implementar manejo de rate limiting con backoff - [1.5h]
- [ ] Tests unitarios de sincronización (mock de Google API) - [3h]
- [ ] Tests de conversión de formato - [2h]
- [ ] Tests de manejo de errores - [2h]

## Componentes Afectados

- **backend:** GoogleCalendarSyncService, Queue system, Format converters

## Dependencias

- US-066 y US-067 deben estar completas

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
