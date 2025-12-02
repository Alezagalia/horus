# US-071: Pantallas CreateEventScreen y EditEventScreen

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-071
**Título:** Pantallas CreateEventScreen y EditEventScreen

## Descripción

Como usuario, quiero crear y editar eventos con todos sus detalles desde formularios intuitivos, para gestionar mi calendario de forma completa.

## Criterios de Aceptación

- [ ] Pantalla `CreateEventScreen` con formulario:
  - Campo título (requerido, max 200 caracteres)
  - Campo descripción (opcional, multilinea)
  - Selector de categoría (solo categorías de scope 'eventos')
  - Campo ubicación (opcional, max 200 caracteres)
  - Date picker para fecha de inicio
  - Time picker para hora de inicio
  - Date picker para fecha de fin
  - Time picker para hora de fin
  - Toggle "Todo el día" (oculta time pickers)
  - Toggle "Evento recurrente"
  - Si recurrente: selector de frecuencia (Diaria, Semanal, Mensual) y opciones RRULE
  - Selector de recordatorio (15 min, 30 min, 1 hora, 1 día antes, personalizado)
  - Toggle "Sincronizar con Google" (visible solo si Google conectado)
  - Botón "Crear Evento"
- [ ] Pantalla `EditEventScreen` con mismo formulario pre-poblado:
  - Todos los campos editables
  - Selector de estado (Pendiente, Completado, Cancelado)
  - Si es evento recurrente: opción "Editar solo este evento" vs "Editar todos"
  - Botón "Guardar Cambios"
  - Botón "Eliminar Evento" (con confirmación)
- [ ] Validaciones en tiempo real:
  - Título no vacío
  - Fecha/hora de fin >= fecha/hora de inicio
  - Si recurrente: validación de RRULE
  - Mostrar errores debajo de campos
- [ ] Integración con endpoints:
  - POST /api/events para crear (US-066)
  - PUT /api/events/:id para actualizar (US-066)
  - DELETE /api/events/:id para eliminar (US-066)
- [ ] Loading states en botones mientras se guarda
- [ ] Toast de éxito/error después de operaciones
- [ ] Navegación de vuelta a CalendarScreen después de guardar
- [ ] Dialog de confirmación al eliminar: "¿Eliminar evento? ¿Solo este o todos los futuros?"

## Tareas Técnicas

- [ ] Crear pantallas CreateEventScreen y EditEventScreen - [2h]
- [ ] Implementar formulario con react-hook-form + Zod validation - [2.5h]
- [ ] Crear componente RecurrencePicker con opciones RRULE - [2h]
- [ ] Integrar date/time pickers nativos - [1.5h]
- [ ] Implementar lógica de "Todo el día" (ocultar time pickers) - [1h]
- [ ] Integrar con endpoints de US-066 - [1.5h]
- [ ] Implementar dialog de confirmación de eliminación - [1h]
- [ ] Loading states y error handling - [1.5h]
- [ ] Tests de componentes - [3h]

## Componentes Afectados

- **mobile:** CreateEventScreen, EditEventScreen, RecurrencePicker, Form components

## Dependencias

- US-066 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
