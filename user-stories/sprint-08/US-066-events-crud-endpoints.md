# US-066: Endpoints CRUD de Eventos

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-066
**Título:** Endpoints CRUD de Eventos

## Descripción

Como usuario, quiero crear, leer, actualizar y eliminar eventos desde la aplicación, para gestionar mi calendario de actividades.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/events` crea nuevo evento:
  - Body: title, description?, categoryId, location?, startDateTime, endDateTime, isAllDay?, isRecurring?, rrule?, reminderMinutes?, syncWithGoogle?
  - Valida categoryId existe y es de scope 'eventos'
  - Valida endDateTime > startDateTime
  - Si isAllDay = true: normaliza horas a 00:00:00 (inicio) y 23:59:59 (fin)
  - Si isRecurring = true: valida rrule con librería rrule
  - Si isRecurring = true: genera instancias para próximos 30 días
  - Devuelve evento creado con id
- [ ] Endpoint `GET /api/events` lista eventos del usuario:
  - Query params: from (fecha inicio), to (fecha fin), categoryId?, status?
  - Devuelve solo eventos en el rango de fechas especificado
  - Incluye eventos recurrentes expandidos (instancias)
  - Ordenados por startDateTime ASC
  - Incluye categoría denormalizada
- [ ] Endpoint `GET /api/events/:id` obtiene evento específico:
  - Incluye todos los detalles
  - Si es evento recurrente padre, incluye lista de próximas ocurrencias
  - Devuelve 404 si no existe o no pertenece al usuario
- [ ] Endpoint `PUT /api/events/:id` actualiza evento:
  - Permite actualizar: title, description, categoryId, location, startDateTime, endDateTime, isAllDay, reminderMinutes, status
  - Al cambiar status a 'completado': set completedAt = now()
  - Al cambiar status a 'cancelado': set canceledAt = now()
  - Si cambian fechas de evento recurrente: pregunta si actualizar solo esta instancia o todas
  - Valida ownership
- [ ] Endpoint `DELETE /api/events/:id` elimina evento:
  - Si es evento recurrente: pregunta si eliminar solo esta instancia, futuras, o todas
  - Devuelve 404 si no existe o no pertenece al usuario
  - Si syncWithGoogle = true: marca para sincronizar eliminación con Google
- [ ] Validaciones con Zod schemas
- [ ] Response time < 200ms para GET, < 300ms para POST/PUT/DELETE

## Tareas Técnicas

- [ ] Instalar librería `rrule` para manejo de eventos recurrentes - [0.5h]
- [ ] Crear service `events.service.ts` con lógica CRUD - [3h]
- [ ] Implementar función expandRecurringEvents(rrule, from, to) - [2h]
- [ ] Implementar validaciones con Zod (CreateEventSchema, UpdateEventSchema) - [1.5h]
- [ ] Crear controller `events.controller.ts` con endpoints - [2h]
- [ ] Implementar filtros (categoryId, status, fecha) - [1.5h]
- [ ] Implementar lógica de timestamps (completedAt, canceledAt) - [1h]
- [ ] Tests unitarios del service (>80% coverage) - [3h]
- [ ] Tests de integración de endpoints - [3h]
- [ ] Tests de eventos recurrentes (expansión correcta) - [2h]
- [ ] Documentación de API en Swagger - [1h]

## Componentes Afectados

- **backend:** EventService, EventController, API routes, Validation schemas

## Dependencias

- US-065 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
