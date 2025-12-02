# US-063: Pantalla TaskDetailScreen con Checklist

**Sprint:** 07 - Gestión de Tareas
**ID:** US-063
**Título:** Pantalla TaskDetailScreen con Checklist

## Descripción

Como usuario, quiero ver el detalle completo de una tarea y gestionar su checklist, para desglosar tareas grandes y hacer seguimiento detallado.

## Criterios de Aceptación

- [ ] Nueva pantalla `TaskDetailScreen` accesible desde:
  - Tap en TaskCard (excepto en checkbox)
  - Navegación después de crear tarea
- [ ] Secciones de la pantalla:
  1. **Header:**
     - Título de la tarea (editable in-place con tap)
     - Color de categoría
     - Badge de prioridad
  2. **Detalles:**
     - Descripción (editable in-place)
     - Categoría (con icono y color)
     - Estado actual (chip con color)
     - Fecha de vencimiento con color semáforo
     - Fecha de creación (relativa)
  3. **Checklist:**
     - Lista de items con checkboxes
     - Input "Agregar item" al final
     - Barra de progreso visual: "3/5 completados (60%)"
     - Drag & drop para reordenar items
     - Swipe left en item para eliminar
  4. **Acciones:**
     - Botón "Editar Tarea" (navega a EditTaskScreen)
     - Botón "Completar Tarea" (si no completada)
     - Botón "Marcar Pendiente" (si completada)
- [ ] Operaciones de checklist:
  - Tap en checkbox marca/desmarca item (actualiza inmediatamente)
  - Escribir en input y presionar Enter: crea nuevo item
  - Drag & drop items: actualiza orden (llama a endpoint de reorder)
  - Swipe left: muestra botón "Eliminar"
- [ ] Progreso de checklist:
  - Barra visual con porcentaje
  - Badge "Checklist completo ✓" cuando todos completados
  - Actualización en tiempo real al marcar items
- [ ] Loading states y optimistic updates
- [ ] Integración con endpoints de US-058

## Tareas Técnicas

- [ ] Crear pantalla TaskDetailScreen con secciones - [2h]
- [ ] Implementar edición in-place de título y descripción - [1.5h]
- [ ] Crear componente ChecklistItem con checkbox y swipe - [2h]
- [ ] Implementar input de agregar item con auto-focus - [1h]
- [ ] Implementar drag & drop de items - [2h]
- [ ] Implementar barra de progreso animada - [1h]
- [ ] Integrar con endpoints de US-058 (crear, actualizar, eliminar, reordenar) - [2.5h]
- [ ] Implementar optimistic updates con TanStack Query - [1.5h]
- [ ] Loading states y error handling - [1h]
- [ ] Tests de componente - [3h]

## Componentes Afectados

- **mobile:** TaskDetailScreen, ChecklistItem, Progress components

## Dependencias

- US-057 y US-058 deben estar completas

## Prioridad

high

## Esfuerzo Estimado

7 Story Points
