# US-057: Endpoints CRUD de Tareas

**Sprint:** 07 - Gestión de Tareas
**ID:** US-057
**Título:** Endpoints CRUD de Tareas

## Descripción

Como usuario, quiero crear, leer, actualizar y eliminar tareas desde la aplicación, para gestionar mis actividades puntuales.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/tasks` crea nueva tarea:
  - Body: title, description?, categoryId, priority?, dueDate?
  - Valida categoryId existe y es de scope 'tareas'
  - Valida dueDate >= hoy si se proporciona
  - Calcula orderPosition (último + 1)
  - Devuelve tarea creada con id
- [ ] Endpoint `GET /api/tasks` lista tareas del usuario:
  - Query params opcionales: status, priority, categoryId, dueDateFilter ('overdue', 'today', 'week', 'month', 'none')
  - Devuelve solo tareas con isActive = true y archivedAt = null
  - Ordenadas por orderPosition ASC por defecto
  - Incluye categoría denormalizada
  - Incluye conteo de checklist (total items, items completados)
- [ ] Endpoint `GET /api/tasks/:id` obtiene tarea específica:
  - Incluye todos los items de checklist ordenados por position
  - Devuelve 404 si no existe o no pertenece al usuario
- [ ] Endpoint `PUT /api/tasks/:id` actualiza tarea:
  - Permite actualizar: title, description, categoryId, priority, status, dueDate
  - Al cambiar status a 'completada': set completedAt = now()
  - Al cambiar status a 'cancelada': permite agregar cancelReason
  - Al cambiar de 'completada' a otro estado: set completedAt = null, archivedAt = null
  - Valida ownership
- [ ] Endpoint `DELETE /api/tasks/:id` elimina tarea físicamente:
  - Elimina tarea y todos sus checklist items (CASCADE)
  - Devuelve 404 si no existe o no pertenece al usuario
  - Recalcula orderPosition de tareas restantes
- [ ] Validaciones con Zod schemas
- [ ] Response time < 200ms para GET, < 300ms para POST/PUT/DELETE

## Tareas Técnicas

- [ ] Crear service `tasks.service.ts` con lógica CRUD - [3h]
- [ ] Implementar validaciones con Zod (CreateTaskSchema, UpdateTaskSchema) - [1.5h]
- [ ] Crear controller `tasks.controller.ts` con endpoints - [2h]
- [ ] Implementar filtros (status, priority, dueDate, categoryId) - [2h]
- [ ] Implementar lógica de timestamps (completedAt, canceledAt) - [1h]
- [ ] Implementar recálculo de orderPosition al eliminar - [1h]
- [ ] Tests unitarios del service (>80% coverage) - [3h]
- [ ] Tests de integración de endpoints - [3h]
- [ ] Documentación de API en Swagger - [1h]

## Componentes Afectados

- **backend:** TaskService, TaskController, API routes, Validation schemas

## Dependencias

- US-056 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
