# US-061: Pantalla TareasScreen con Listado y Filtros

**Sprint:** 07 - Gestión de Tareas
**ID:** US-061
**Título:** Pantalla TareasScreen con Listado y Filtros

## Descripción

Como usuario, quiero ver todas mis tareas en una lista organizada con filtros, para gestionar eficientemente mis actividades.

## Criterios de Aceptación

- [ ] Nueva pantalla `TareasScreen` accesible desde navegación principal
- [ ] Lista de tareas con cards mostrando:
  - Título con color de categoría
  - Color de fondo según fecha de vencimiento (sistema semáforo)
  - Badge de prioridad si es "alta" (⚠️ rojo)
  - Fecha de vencimiento con formato relativo ("Hoy", "Mañana", "En 3 días")
  - Progreso de checklist si tiene items ("3/5 completados")
  - Checkbox para toggle rápido de completado
- [ ] Barra de filtros en header con chips:
  - Filtro por estado (Todas, Pendientes, En Progreso, Completadas)
  - Filtro por prioridad (Todas, Alta, Media, Baja)
  - Filtro por fecha (Todas, Vencidas, Hoy, Esta Semana, Sin Fecha)
  - Selector de categoría (multi-select)
- [ ] Sistema de color semáforo implementado:
  - 🔵 Azul (#ADD8E6): Tarea vencida
  - 🔴 Rojo pastel (#FFB3B3): Vence en 0-2 días
  - 🟡 Amarillo (#FFEB9C): Vence en 3-7 días
  - 🟢 Verde (#C6E0B4): Vence en +7 días
  - Sin color: Sin fecha de vencimiento
  - Gris (#E0E0E0): Completada o cancelada
- [ ] Drag & drop para reordenar tareas (actualiza orderPosition en backend)
- [ ] Pull-to-refresh actualiza lista
- [ ] FAB "+" para crear nueva tarea
- [ ] Empty state cuando no hay tareas ("Crea tu primera tarea")
- [ ] Loading states mientras carga datos

## Tareas Técnicas

- [ ] Crear pantalla TareasScreen - [1.5h]
- [ ] Crear componente TaskCard con todas las variantes - [3h]
- [ ] Implementar sistema de color semáforo (función calcularColorTarea) - [1.5h]
- [ ] Implementar barra de filtros con chips - [2h]
- [ ] Integrar con endpoint GET /api/tasks (US-057) - [1h]
- [ ] Implementar drag & drop con react-native-draggable-flatlist - [2.5h]
- [ ] Implementar toggle rápido (checkbox) con US-060 - [1h]
- [ ] Loading states y error handling - [1.5h]
- [ ] Empty state con ilustración - [0.5h]
- [ ] Tests de componente - [3h]

## Componentes Afectados

- **mobile:** TareasScreen, TaskCard, Filter components

## Dependencias

- US-057 y US-060 deben estar completas

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
