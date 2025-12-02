# US-025: Detalle de Hábito

**Sprint:** 03 - Habits CRUD (Backend + Mobile)
**ID:** US-025
**Título:** Detalle de Hábito

## Descripción

Como usuario, quiero ver el detalle completo de un hábito incluyendo su configuración y estadísticas básicas.

## Criterios de Aceptación

- [ ] Pantalla HabitDetailScreen accesible desde tap en HabitCard
- [ ] Header con nombre del hábito y botón "Editar"
- [ ] Sección "Configuración": muestra tipo, periodicidad, momento del día, recordatorio, categoría
- [ ] Sección "Estadísticas Rápidas": racha actual, récord de racha, días completados (últimos 30)
- [ ] Botón "Ver Estadísticas Completas" → navega a HabitStatsScreen
- [ ] Botón "Eliminar Hábito" (abajo, color rojo)
- [ ] Diseño limpio y readable

## Tareas Técnicas

- [ ] Crear HabitDetailScreen - [2.5h]
- [ ] Sección de configuración - [1.5h]
- [ ] Sección de estadísticas rápidas - [1.5h]
- [ ] Integrar con GET /api/habits/:id - [1h]
- [ ] Navegación a editar y stats - [0.5h]
- [ ] Tests - [1h]

## Componentes Afectados

- **mobile:** HabitDetailScreen

## Dependencias

- US-021 y US-022

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
