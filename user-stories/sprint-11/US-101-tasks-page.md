# US-101: Página de Tareas con Filtros y Checklist

**Sprint:** 11 - Frontend Web Base
**ID:** US-101
**Título:** Página de Tareas con Filtros y Checklist

## Descripción

Como usuario web, quiero ver mis tareas con filtros y poder gestionarlas (crear, editar, completar), para organizar mi trabajo desde el navegador.

## Criterios de Aceptación

- [ ] Página `TasksPage` (`/tasks`) implementada
- [ ] Header de página:
  - Título: "Tareas"
  - Botón "Nueva Tarea" → abre modal/página de crear tarea
  - Filtros:
    - Por status: Todas, Pendientes, En Progreso, Completadas
    - Por prioridad: Todas, Alta, Media, Baja
    - Por categoría: dropdown
  - Ordenamiento: Por fecha vencimiento, Por prioridad, Por fecha creación
- [ ] Lista de tareas en cards:
  - Checkbox para marcar completada
  - Título de tarea
  - Descripción (truncada, expandible)
  - Badge de prioridad (color-coded)
  - Due date: "Vence hoy" (rojo), "Vence mañana" (amarillo), etc.
  - Progreso de checklist: "2/5 items completados"
  - Botones: Ver detalles, Editar, Eliminar
  - Tareas vencidas con borde rojo
  - Tareas completadas con opacidad y tachado
- [ ] Modal/Página de Crear Tarea:
  - Título (obligatorio)
  - Descripción (opcional)
  - Categoría
  - Prioridad: Alta, Media, Baja
  - Fecha de vencimiento (opcional)
  - Checklist (sección dinámica)
  - Botones: "Guardar" y "Cancelar"
- [ ] Modal de Ver Detalles de Tarea
- [ ] Editar tarea
- [ ] Completar tarea con optimistic update
- [ ] Eliminar tarea (soft delete)
- [ ] Atajos de teclado:
  - `n`: nueva tarea
  - `e`: editar tarea seleccionada
  - `d`: eliminar tarea seleccionada
  - `Space`: marcar/desmarcar completada

## Tareas Técnicas

- [ ] Crear página TasksPage - [1.5h]
- [ ] Crear componente TaskCard - [1.5h]
- [ ] Implementar filtros y ordenamiento - [1.5h]
- [ ] Crear modal/página CreateTaskPage - [2h]
- [ ] Implementar formulario con React Hook Form + Zod - [1.5h]
- [ ] Implementar checklist dinámico en formulario - [1.5h]
- [ ] Crear modal de detalles de tarea - [1h]
- [ ] Implementar lógica de completar/editar/eliminar - [1.5h]
- [ ] Integrar con API usando TanStack Query - [1.5h]
- [ ] Implementar atajos de teclado - [1h]
- [ ] Escribir tests - [2h]

## Componentes Afectados

- **web:** TasksPage, CreateTaskPage, TaskCard, TaskForm, Checklist

## Dependencias

- US-096 (MainLayout)
- Backend endpoints de tareas (Sprint 7)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
