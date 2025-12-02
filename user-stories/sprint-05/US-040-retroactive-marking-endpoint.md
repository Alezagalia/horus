# US-040: Endpoint de Marcado Retroactivo con Validación

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-040
**Título:** Endpoint de Marcado Retroactivo con Validación

## Descripción

Como usuario, quiero marcar hábitos de días anteriores que olvidé registrar, para mantener mi historial preciso y no perder rachas por olvido.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/habits/:id/records/retroactive` permite marcar hábito de fecha pasada
- [ ] Body: `{ date: "YYYY-MM-DD", completed: boolean, value?: number, notes?: string }`
- [ ] Valida que fecha esté en el rango permitido: (hoy - 7 días) <= fecha <= hoy
- [ ] Devuelve 400 si fecha es futura o más de 7 días atrás
- [ ] Valida que el hábito debe realizarse en esa fecha según periodicidad (devuelve 400 si no aplica)
- [ ] Crea o actualiza HabitRecord para esa fecha
- [ ] Actualiza HabitoDelDia correspondiente (genera on-demand si no existe)
- [ ] **CRÍTICO:** Dispara recálculo completo de racha desde esa fecha hasta hoy
- [ ] Devuelve respuesta con racha actualizada: `{ success: true, currentStreak, longestStreak, recordId }`
- [ ] Es idempotente (múltiples llamadas con mismo valor no generan errores)

## Tareas Técnicas

- [ ] Crear endpoint `POST /api/habits/:id/records/retroactive` - [1h]
- [ ] Validar rango de fechas (7 días atrás máximo) con Zod - [1h]
- [ ] Validar periodicidad con `debiaRealizarseEnFecha()` - [0.5h]
- [ ] Crear/actualizar HabitRecord con transacción - [1h]
- [ ] Generar HabitoDelDia on-demand si no existe - [0.5h]
- [ ] Integrar con algoritmo de recálculo de rachas (reutilizar Sprint 4) - [2h]
- [ ] Tests de recálculo de rachas con marcado retroactivo - [3h]
- [ ] Tests de edge cases (marcar día que rompe racha, marcar día que extiende racha) - [2h]

## Componentes Afectados

- **backend:** HabitController, HabitService, StreakService

## Dependencias

- US-039 del Sprint 4 (algoritmo de rachas) debe estar completa

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
