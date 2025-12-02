# US-058: Endpoints de Gestión de Checklist

**Sprint:** 07 - Gestión de Tareas
**ID:** US-058
**Título:** Endpoints de Gestión de Checklist

## Descripción

Como usuario, quiero agregar, editar, reordenar y eliminar items de checklist en mis tareas, para desglosar tareas grandes en pasos más pequeños.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/tasks/:taskId/checklist` agrega item:
  - Body: title
  - Calcula position (último + 1)
  - completed = false por defecto
  - Devuelve item creado
  - Devuelve 404 si tarea no existe o no pertenece al usuario
- [ ] Endpoint `PUT /api/tasks/:taskId/checklist/:itemId` actualiza item:
  - Permite actualizar: title, completed
  - Valida ownership de tarea
  - Devuelve item actualizado
- [ ] Endpoint `DELETE /api/tasks/:taskId/checklist/:itemId` elimina item:
  - Elimina físicamente
  - Recalcula positions de items restantes
  - Devuelve 204 No Content
- [ ] Endpoint `PUT /api/tasks/:taskId/checklist/reorder` reordena items:
  - Body: array de { itemId, position }
  - Actualiza positions en batch
  - Validaciones de integridad (todos los ids deben existir)
  - Devuelve items reordenados
- [ ] Todas las operaciones validan ownership de la tarea padre

## Tareas Técnicas

- [ ] Implementar createChecklistItem() en tasks.service.ts - [1h]
- [ ] Implementar updateChecklistItem() - [1h]
- [ ] Implementar deleteChecklistItem() con recálculo de positions - [1.5h]
- [ ] Implementar reorderChecklistItems() con batch update - [2h]
- [ ] Crear controller endpoints - [1h]
- [ ] Tests unitarios de lógica de reordenamiento - [2h]
- [ ] Tests de integración de endpoints - [2h]
- [ ] Documentación de API - [0.5h]

## Componentes Afectados

- **backend:** TaskService, TaskController

## Dependencias

- US-057 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
