# US-060: Endpoint de Toggle de Estado de Tarea

**Sprint:** 07 - Gestión de Tareas
**ID:** US-060
**Título:** Endpoint de Toggle de Estado de Tarea

## Descripción

Como usuario, quiero marcar rápidamente una tarea como completada o pendiente con un tap, para actualizar el estado sin abrir el formulario de edición.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/tasks/:id/toggle` cambia estado de forma inteligente:
  - Si status = 'pendiente' o 'en_progreso' → cambia a 'completada' y set completedAt = now()
  - Si status = 'completada' → cambia a 'pendiente' y set completedAt = null, archivedAt = null
  - Si status = 'cancelada' → no hace nada, devuelve 400 (debe reactivarse explícitamente)
- [ ] Devuelve tarea actualizada con nuevo status
- [ ] Es idempotente (múltiples llamadas no generan errores)
- [ ] Valida ownership
- [ ] Response time < 150ms

## Tareas Técnicas

- [ ] Implementar lógica de toggleTaskStatus() en tasks.service.ts - [1.5h]
- [ ] Crear endpoint POST /api/tasks/:id/toggle - [0.5h]
- [ ] Manejo de timestamps (completedAt, archivedAt) - [1h]
- [ ] Tests unitarios de diferentes transiciones de estado - [2h]
- [ ] Tests de edge cases (tarea cancelada, ya archivada) - [1h]

## Componentes Afectados

- **backend:** TaskService, TaskController

## Dependencias

- US-057 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
