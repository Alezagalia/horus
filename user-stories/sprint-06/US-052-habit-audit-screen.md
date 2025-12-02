# US-052: Pantalla HabitAuditScreen - Timeline de Cambios

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-052
**Título:** Pantalla HabitAuditScreen - Timeline de Cambios

## Descripción

Como usuario, quiero ver el historial de cambios de un hábito en formato timeline visual, para entender qué modificaciones realicé a lo largo del tiempo.

## Criterios de Aceptación

- [ ] Nueva pantalla `HabitAuditScreen` accesible desde:
  - HabitosScreen (menú contextual en hábito → "Ver historial")
  - EditHabitScreen (botón "Historial de cambios" en footer)
- [ ] Timeline vertical con diseño cronológico (más reciente arriba)
- [ ] Cada entrada muestra:
  - Tipo de cambio con icono (CREATED: ✨, UPDATED: ✏️, DELETED: 🗑️, REACTIVATED: 🔄)
  - Campo modificado (ej: "Periodicidad")
  - Cambio: "oldValue → newValue" con formato legible
  - Fecha y hora del cambio (relativa: "Hace 2 días")
  - Razón (si existe)
- [ ] Formato legible de valores:
  - Periodicidad: "Diaria" en lugar de "daily"
  - WeeklyDays: "Lun, Mie, Vie" en lugar de "[1,3,5]"
  - Colores: swatch visual en lugar de código hex
- [ ] Loading skeleton mientras carga datos
- [ ] Empty state si no hay cambios (hábito recién creado)
- [ ] Pull-to-refresh actualiza timeline

## Tareas Técnicas

- [ ] Crear pantalla HabitAuditScreen - [1.5h]
- [ ] Implementar componente TimelineItem con variantes por changeType - [2h]
- [ ] Implementar formateo de valores (periodicidad, días, colores) - [2h]
- [ ] Integrar con endpoint GET /api/habits/:id/audit (US-048) - [1h]
- [ ] Implementar formato de fechas relativas (date-fns) - [0.5h]
- [ ] Loading skeleton con react-native-skeleton-placeholder - [1h]
- [ ] Empty state con ilustración - [0.5h]
- [ ] Navegación desde HabitosScreen y EditHabitScreen - [0.5h]
- [ ] Tests de componente - [2h]
- [ ] Tests de formateo de valores - [1.5h]

## Componentes Afectados

- **mobile:** HabitAuditScreen, TimelineItem

## Dependencias

- US-048 debe estar completa (endpoint de historial)

## Prioridad

medium

## Esfuerzo Estimado

5 Story Points
