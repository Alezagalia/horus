# US-031: Algoritmo de Cálculo de Rachas

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-031
**Título:** Algoritmo de Cálculo de Rachas

## Descripción

Como sistema, quiero calcular automáticamente las rachas (currentStreak, longestStreak) cuando un usuario marca un hábito, para proporcionar feedback motivacional preciso y confiable.

## Criterios de Aceptación

- [ ] Función `actualizarRacha(habitId, fecha, completado)` implementada y testeada exhaustivamente
- [ ] Algoritmo:
  - Si hábito completado hoy Y ayer también (y debía realizarse): currentStreak++
  - Si hábito completado hoy PERO ayer NO (y debía realizarse): currentStreak = 1
  - Si hábito NO completado hoy (rompe racha): currentStreak = 0
  - Si currentStreak > longestStreak: actualizar récord (longestStreak = currentStreak)
- [ ] Algoritmo considera periodicidad del hábito:
  - Hábitos diarios: verifica todos los días
  - Hábitos semanales: solo cuenta días que corresponden (ej: Lun/Mie/Vie)
  - Hábitos mensuales: cuenta mes a mes (mismo día)
  - Hábitos custom: cuenta cada X días desde creación
- [ ] Actualiza campo `lastCompletedDate` en modelo Habit
- [ ] Función es transaccional (rollback si falla)
- [ ] Maneja edge cases:
  - Hábito creado hoy (racha = 1 si se completa)
  - Cambio de periodicidad (mantiene racha si aplica)
  - Marcado retroactivo recalcula toda la secuencia
- [ ] Tests cubren >95% de casos (incluyendo edge cases)

## Tareas Técnicas

- [ ] Implementar función `actualizarRacha()` en `services/streaks.service.ts` - [3h]
- [ ] Implementar lógica de "días consecutivos" por periodicidad - [2h]
- [ ] Función auxiliar `debiaRealizarseEnFecha(habit, fecha)` para validar periodicidad - [1h]
- [ ] Manejo de transacciones Prisma - [1h]
- [ ] Tests exhaustivos con diferentes periodicidades - [3h]
- [ ] Tests de edge cases (cambio de periodicidad, retroactivo, etc.) - [2h]
- [ ] Documentación del algoritmo en código - [1h]

## Componentes Afectados

- **backend:** StreakService, Habit model

## Dependencias

- Ninguna (puede desarrollarse en paralelo)

## Prioridad

critical

## Esfuerzo Estimado

8 Story Points
