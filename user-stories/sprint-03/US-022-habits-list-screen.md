# US-022: Pantalla de Lista de Hábitos (Mobile)

**Sprint:** 03 - Habits CRUD (Backend + Mobile)
**ID:** US-022
**Título:** Pantalla de Lista de Hábitos (Mobile)

## Descripción

Como usuario, quiero ver la lista completa de mis hábitos para gestionarlos y ver su configuración.

## Criterios de Aceptación

- [ ] Pantalla HabitsListScreen accesible desde navegación principal
- [ ] Header "Mis Hábitos" con botón "Nuevo Hábito" (icono +)
- [ ] Input de búsqueda para filtrar por nombre
- [ ] Filtros: por categoría (dropdown), toggle "Mostrar inactivos"
- [ ] Lista de hábitos mostrando: icono categoría, nombre, tipo (badge CHECK/NUMERIC), periodicidad, racha actual (🔥 X días)
- [ ] Tap en hábito → navega a HabitDetailScreen
- [ ] Pull to refresh
- [ ] Empty state: "No tienes hábitos" con ilustración + botón "Crear primero"
- [ ] Loading state: skeleton de lista
- [ ] Ordenamiento drag & drop para cambiar order

## Tareas Técnicas

- [ ] Crear HabitsListScreen - [2.5h]
- [ ] Crear componente HabitCard - [2h]
- [ ] Implementar búsqueda - [1h]
- [ ] Implementar filtros - [1.5h]
- [ ] Integrar con GET /api/habits - [1h]
- [ ] Pull to refresh - [0.5h]
- [ ] Empty state - [0.5h]
- [ ] Drag & drop reordering - [2h]
- [ ] Tests - [2h]

## Componentes Afectados

- **mobile:** HabitsListScreen, HabitCard, SearchBar, FilterDropdown

## Dependencias

- US-021 (Backend CRUD)

## Prioridad

critical

## Esfuerzo Estimado

8 Story Points
