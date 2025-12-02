# US-062: Pantallas CreateTaskScreen y EditTaskScreen

**Sprint:** 07 - Gestión de Tareas
**ID:** US-062
**Título:** Pantallas CreateTaskScreen y EditTaskScreen

## Descripción

Como usuario, quiero crear y editar tareas con todos sus detalles desde formularios intuitivos, para capturar toda la información necesaria de cada tarea.

## Criterios de Aceptación

- [ ] Pantalla `CreateTaskScreen` con formulario:
  - Campo título (requerido, max 200 caracteres)
  - Campo descripción (opcional, multilinea)
  - Selector de categoría (solo categorías de scope 'tareas')
  - Selector de prioridad (Alta, Media, Baja) con iconos
  - Date picker para fecha de vencimiento (opcional)
  - Toggle "Sin fecha" para limpiar fecha
  - Botón "Crear Tarea"
- [ ] Pantalla `EditTaskScreen` con mismo formulario pre-poblado:
  - Todos los campos editables
  - Selector de estado (Pendiente, En Progreso, Completada, Cancelada)
  - Si status = 'cancelada': mostrar input de razón de cancelación
  - Botón "Guardar Cambios"
  - Botón "Eliminar Tarea" (con confirmación)
- [ ] Validaciones en tiempo real:
  - Título no vacío
  - Fecha de vencimiento >= hoy si se proporciona
  - Categoría seleccionada
  - Mostrar errores debajo de campos
- [ ] Integración con endpoints:
  - POST /api/tasks para crear (US-057)
  - PUT /api/tasks/:id para actualizar (US-057)
  - DELETE /api/tasks/:id para eliminar (US-057)
- [ ] Loading states en botones mientras se guarda
- [ ] Toast de éxito/error después de operaciones
- [ ] Navegación de vuelta a TareasScreen después de guardar
- [ ] Dialog de confirmación al eliminar: "¿Eliminar tarea? Esta acción no se puede deshacer"

## Tareas Técnicas

- [ ] Crear pantallas CreateTaskScreen y EditTaskScreen - [2h]
- [ ] Implementar formulario con react-hook-form + Zod validation - [2.5h]
- [ ] Crear componente PriorityPicker con iconos - [1h]
- [ ] Crear componente CategoryPicker (reutilizar del Sprint 2) - [0.5h]
- [ ] Integrar date picker con @react-native-community/datetimepicker - [1.5h]
- [ ] Integrar con endpoints de US-057 - [1.5h]
- [ ] Implementar dialog de confirmación de eliminación - [1h]
- [ ] Loading states y error handling - [1.5h]
- [ ] Tests de componentes - [3h]

## Componentes Afectados

- **mobile:** CreateTaskScreen, EditTaskScreen, Form components

## Dependencias

- US-057 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
