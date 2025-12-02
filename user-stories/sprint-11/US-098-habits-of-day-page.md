# US-098: Página de Hábitos del Día con Marcar Completado

**Sprint:** 11 - Frontend Web Base
**ID:** US-098
**Título:** Página de Hábitos del Día con Marcar Completado

## Descripción

Como usuario web, quiero ver todos mis hábitos del día actual y poder marcarlos como completados, para seguir mi progreso diario desde el navegador.

## Criterios de Aceptación

- [ ] Página `HabitsOfDayPage` (`/habits/today`) implementada
- [ ] Header de página:
  - Título: "Hábitos de Hoy - {fecha}"
  - Selector de fecha (datepicker) para ver días anteriores
  - Progreso general del día: "3/5 completados (60%)"
  - Barra de progreso visual
- [ ] Hábitos agrupados por momento del día:
  - Sección "Mañana" (timeOfDay === 'manana')
  - Sección "Tarde" (timeOfDay === 'tarde')
  - Sección "Noche" (timeOfDay === 'noche')
  - Sección "Cualquier momento" (timeOfDay === 'anytime')
- [ ] Cada hábito muestra:
  - Checkbox grande para marcar completado (tipo CHECK)
  - Input numérico para hábitos NUMERIC
  - Nombre del hábito
  - Icono y color de categoría
  - Badge de racha actual
  - Para hábitos numéricos: progreso "3/8 vasos"
  - Notas (campo opcional, expandible)
- [ ] Interacciones:
  - Click en checkbox: marca/desmarca instantáneamente (optimistic update)
  - Input en hábito NUMERIC: actualiza valor
  - Botones +/- para hábitos numéricos
  - Animación sutil al completar
- [ ] Atajos de teclado:
  - `Space` en hábito seleccionado: marcar/desmarcar
  - `j` / `k`: navegar entre hábitos
  - `n`: agregar nota al hábito seleccionado
- [ ] Loading state mientras carga hábitos
- [ ] Empty state si no hay hábitos del día
- [ ] Actualización optimista con TanStack Query
- [ ] Notificación toast al completar hábito

## Tareas Técnicas

- [ ] Crear página HabitsOfDayPage - [1.5h]
- [ ] Crear componente HabitCard (CHECK y NUMERIC) - [2h]
- [ ] Implementar lógica de marcar completado con optimistic updates - [1.5h]
- [ ] Implementar agrupación por momento del día - [1h]
- [ ] Integrar con API usando TanStack Query - [1h]
- [ ] Implementar datepicker para seleccionar fecha - [1h]
- [ ] Implementar atajos de teclado (j, k, Space, n) - [1.5h]
- [ ] Agregar animaciones y toasts - [1h]
- [ ] Escribir tests - [1.5h]

## Componentes Afectados

- **web:** HabitsOfDayPage, HabitCard, datepicker, keyboard shortcuts

## Dependencias

- US-096 (MainLayout)
- Backend endpoints de hábitos del día (Sprint 3, 4)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
