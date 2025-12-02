# US-069: Sincronización Google → Local (Importar)

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-069
**Título:** Sincronización Google → Local (Importar)

## Descripción

Como usuario, quiero que los eventos que creo o actualizo en Google Calendar aparezcan automáticamente en Horus, para tener todo sincronizado sin duplicar esfuerzos.

## Criterios de Aceptación

- [ ] Cron job se ejecuta cada 15 minutos:
  - Busca usuarios con googleCalendarEnabled = true
  - Para cada usuario: sincronizar eventos desde lastSyncAt
- [ ] Endpoint `POST /api/sync/google-calendar/sync` ejecuta sincronización manual:
  - Permite al usuario forzar sincronización inmediata
  - Muestra progreso en UI (eventos importados, actualizados, eliminados)
- [ ] Proceso de importación:
  - GET eventos de Google Calendar desde lastSyncAt
  - Para cada evento de Google:
    a. Buscar en BD por googleEventId
    b. Si existe y Google es más reciente (por updated): actualizar local
    c. Si existe y local es más reciente: mantener local (sincronizar en próximo ciclo)
    d. Si no existe: crear nuevo evento local con googleEventId
  - Actualizar lastSyncAt con timestamp actual
- [ ] Manejo de eventos eliminados en Google:
  - Google devuelve eventos con status = 'cancelled'
  - Marcar evento local como cancelado o eliminarlo (según configuración)
- [ ] Conversión de formato:
  - Mapear campos de Google Calendar a Event local
  - Convertir timezone de UTC a local del usuario
  - Parsear RRULE de Google a formato compatible
  - Asignar categoría default de 'eventos' si no existe
- [ ] Resolución de conflictos:
  - Comparar event.updatedAt (local) vs googleEvent.updated
  - Last-write-wins: el más reciente gana
  - Logging de conflictos resueltos para auditoría

## Tareas Técnicas

- [ ] Implementar fetchGoogleEvents(userId, since) - [2h]
- [ ] Implementar conversión de formato (Google → local) - [2h]
- [ ] Implementar lógica de merge con detección de conflictos - [3h]
- [ ] Implementar cron job de sincronización periódica - [1.5h]
- [ ] Crear endpoint POST /api/sync/google-calendar/sync - [1h]
- [ ] Implementar logging de sincronización (eventos nuevos, actualizados, conflictos) - [1h]
- [ ] Tests unitarios de importación - [3h]
- [ ] Tests de resolución de conflictos - [2h]
- [ ] Tests del cron job - [1.5h]

## Componentes Afectados

- **backend:** GoogleCalendarSyncService, Cron jobs, Conflict resolution

## Dependencias

- US-067 y US-068 deben estar completas

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
