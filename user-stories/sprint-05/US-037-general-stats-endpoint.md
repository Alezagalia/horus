# US-037: Endpoint de Estadísticas Generales del Usuario

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-037
**Título:** Endpoint de Estadísticas Generales del Usuario

## Descripción

Como usuario, quiero ver mis estadísticas generales de hábitos en el dashboard, para tener una visión global de mi progreso y motivarme a seguir.

## Criterios de Aceptación

- [ ] Endpoint `GET /api/habits/stats` devuelve estadísticas generales del usuario autenticado
- [ ] Respuesta incluye:
  - `completionRateToday`: Porcentaje de hábitos completados hoy (0-100)
  - `totalHabitsToday`: Cantidad de hábitos que deben realizarse hoy
  - `completedHabitsToday`: Cantidad completados hoy
  - `longestCurrentStreak`: Racha más larga activa entre todos los hábitos
  - `habitWithLongestStreak`: Hábito con la racha más larga (id, name, streak)
  - `last7DaysCompletion`: Array de 7 objetos {date, completionRate} para gráfico
  - `statsByCategory`: Array de {categoryId, categoryName, totalHabits, completionRate}
- [ ] Cálculo de `completionRateToday` considera solo hábitos que deben realizarse hoy según periodicidad
- [ ] Maneja correctamente cuando usuario no tiene hábitos (devuelve valores en 0, no error)
- [ ] Response time <200ms (incluso con 50+ hábitos)
- [ ] Validaciones: usuario autenticado, formato de respuesta consistente

## Tareas Técnicas

- [ ] Crear service `stats.service.ts` con lógica de cálculo de estadísticas - [2h]
- [ ] Implementar `calculateCompletionRateToday()` considerando periodicidad - [1h]
- [ ] Implementar `getLongestCurrentStreak()` entre todos los hábitos - [1h]
- [ ] Implementar `getLast7DaysCompletion()` con query optimizada - [1.5h]
- [ ] Implementar `getStatsByCategory()` con grouping - [1h]
- [ ] Crear controller y route `GET /api/habits/stats` - [0.5h]
- [ ] Tests unitarios del service (>80% coverage) - [2h]
- [ ] Tests de integración del endpoint - [1.5h]
- [ ] Optimización de queries con includes y select - [1h]

## Componentes Afectados

- **backend:** StatsService, StatsController, API routes

## Dependencias

- Modelo Habit y HabitRecord del Sprint 3-4

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
