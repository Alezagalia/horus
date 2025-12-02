# US-038: Endpoint de Estadísticas de Hábito Específico

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-038
**Título:** Endpoint de Estadísticas de Hábito Específico

## Descripción

Como usuario, quiero ver estadísticas detalladas de un hábito individual, para analizar mi consistencia y progreso en ese hábito específico.

## Criterios de Aceptación

- [ ] Endpoint `GET /api/habits/:id/stats` devuelve estadísticas del hábito específico
- [ ] Respuesta incluye:
  - `currentStreak`: Racha actual
  - `longestStreak`: Récord personal
  - `totalCompletions`: Total de veces completado
  - `overallCompletionRate`: Tasa de cumplimiento desde creación (%)
  - `last30DaysRate`: Tasa de cumplimiento últimos 30 días (%)
  - `last30DaysData`: Array de 30 objetos {date, completed, value, shouldComplete} para gráfico
  - `averageValue`: (Solo hábitos NUMERIC) Valor promedio registrado
  - `minValue`, `maxValue`: (Solo hábitos NUMERIC) Min/max históricos
  - `last30DaysValues`: (Solo hábitos NUMERIC) Array para gráfico de línea
- [ ] Cálculo de `overallCompletionRate` considera solo días que debía realizarse según periodicidad
- [ ] Devuelve 404 si hábito no existe o no pertenece al usuario autenticado
- [ ] Maneja hábitos recién creados (sin registros históricos) sin errores
- [ ] Para hábitos NUMERIC, calcula estadísticas de valores correctamente (promedio, min, max)

## Tareas Técnicas

- [ ] Implementar `getHabitStats(habitId, userId)` en stats.service.ts - [3h]
- [ ] Implementar `getLast30DaysData()` con filtrado por periodicidad - [2h]
- [ ] Implementar estadísticas de valores para hábitos NUMERIC - [1.5h]
- [ ] Crear controller y route `GET /api/habits/:id/stats` - [0.5h]
- [ ] Validación de ownership (hábito pertenece al usuario) - [0.5h]
- [ ] Tests unitarios del service con diferentes periodicidades - [3h]
- [ ] Tests de edge cases (hábito nuevo, sin registros, hábito semanal) - [2h]
- [ ] Optimización de query para obtener 30 días de datos - [1h]

## Componentes Afectados

- **backend:** StatsService, StatsController

## Dependencias

- US-037 debe estar en progreso (reutiliza lógica de cálculos)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
