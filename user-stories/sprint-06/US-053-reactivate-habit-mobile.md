# US-053: Feature de Reactivación en HabitosScreen

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-053
**Título:** Feature de Reactivación en HabitosScreen

## Descripción

Como usuario, quiero reactivar hábitos desactivados desde la lista de hábitos, para volver a incluirlos en mi rutina sin crear uno nuevo.

## Criterios de Aceptación

- [ ] En `HabitosScreen`, agregar filtro/tab para mostrar "Hábitos Inactivos"
- [ ] Hábitos inactivos se muestran con:
  - Badge "Inactivo" en gris
  - Opacidad reducida (0.6)
  - Acción de reactivar habilitada
- [ ] Al tap largo o swipe en hábito inactivo: mostrar acción "Reactivar"
- [ ] Al seleccionar "Reactivar":
  - Mostrar dialog de confirmación: "¿Quieres reactivar este hábito? Tu racha comenzará de nuevo."
  - Input opcional: "Razón de reactivación" (max 200 caracteres)
  - Botones: "Cancelar" y "Reactivar"
- [ ] Al confirmar:
  - Loading indicator mientras se procesa
  - Llamar a endpoint POST /api/habits/:id/reactivate
  - Mostrar toast de éxito: "Hábito reactivado"
  - Mover hábito a lista de activos
  - Actualizar contadores
- [ ] Manejo de errores si falla la reactivación
- [ ] Optimistic update: mover visualmente antes de confirmar respuesta

## Tareas Técnicas

- [ ] Agregar tab/filtro "Inactivos" en HabitosScreen - [1h]
- [ ] Implementar estilos para hábitos inactivos (badge, opacidad) - [1h]
- [ ] Implementar acción de swipe/tap largo para "Reactivar" - [1.5h]
- [ ] Crear dialog de confirmación con input de razón - [1.5h]
- [ ] Integrar con endpoint POST /api/habits/:id/reactivate (US-049) - [1h]
- [ ] Implementar optimistic update con TanStack Query - [1h]
- [ ] Manejo de errores y loading states - [1h]
- [ ] Tests de componente - [2h]

## Componentes Afectados

- **mobile:** HabitosScreen, Dialog components

## Dependencias

- US-049 debe estar completa (endpoint de reactivación)

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
