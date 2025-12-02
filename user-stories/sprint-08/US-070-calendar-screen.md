# US-070: Pantalla CalendarScreen con Vista Mensual

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-070
**Título:** Pantalla CalendarScreen con Vista Mensual

## Descripción

Como usuario, quiero ver mis eventos en una vista de calendario mensual, para tener una visión completa de mis actividades del mes.

## Criterios de Aceptación

- [ ] Nueva pantalla `CalendarScreen` accesible desde navegación principal
- [ ] Vista mensual de calendario con react-native-calendars:
  - Mes actual mostrado por defecto
  - Navegación entre meses con flechas < >
  - Días con eventos tienen indicador visual (dot o badge con número)
  - Día seleccionado con highlight
  - Días de hoy con color especial
- [ ] Al seleccionar un día:
  - Lista de eventos de ese día aparece abajo del calendario
  - Eventos ordenados por startDateTime
  - Cada evento muestra:
    - Hora (si no es todo el día) o "Todo el día"
    - Icono de categoría con color
    - Título del evento
    - Ubicación (si existe) con icono 📍
    - Badge si está sincronizado con Google (icono de Google)
- [ ] Filtros en header:
  - Filtro por categoría (multi-select)
  - Filtro por fuente (Locales, Google, Todos)
  - Filtro por estado (Pendientes, Completados, Cancelados, Todos)
- [ ] FAB "+" para crear nuevo evento
- [ ] Tap en evento abre EventDetailScreen
- [ ] Pull-to-refresh ejecuta sincronización manual si Google está conectado
- [ ] Loading states mientras carga eventos
- [ ] Empty state cuando no hay eventos en el mes ("No hay eventos este mes")

## Tareas Técnicas

- [ ] Crear pantalla CalendarScreen - [1.5h]
- [ ] Integrar react-native-calendars para vista mensual - [2h]
- [ ] Implementar marcado de días con eventos (dots/badges) - [1.5h]
- [ ] Crear componente EventListItem para lista de eventos del día - [2h]
- [ ] Implementar filtros con chips - [1.5h]
- [ ] Integrar con endpoint GET /api/events (US-066) - [1h]
- [ ] Implementar pull-to-refresh con sincronización - [1h]
- [ ] Loading states y error handling - [1h]
- [ ] Empty state con ilustración - [0.5h]
- [ ] Tests de componente - [3h]

## Componentes Afectados

- **mobile:** CalendarScreen, EventListItem, Filter components

## Dependencias

- US-066 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

7 Story Points
