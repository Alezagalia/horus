# US-030: Endpoint para Marcar Hábito del Día Específico

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-030
**Título:** Endpoint para Marcar Hábito del Día Específico

## Descripción

Como usuario, quiero marcar un hábito de una fecha específica (no necesariamente hoy), para poder registrar hábitos que olvidé marcar en días anteriores (hasta 7 días atrás).

## Criterios de Aceptación

- [ ] Endpoint `PUT /api/habits/:id/daily/:fecha` permite marcar hábito de fecha específica (formato YYYY-MM-DD)
- [ ] Valida que fecha esté dentro del rango permitido (hoy - 7 días hasta hoy)
- [ ] Devuelve 400 si fecha es futura o más de 7 días en el pasado
- [ ] Crea/actualiza HabitRecord para esa fecha
- [ ] Actualiza HabitoDelDia correspondiente si existe, sino lo genera on-demand
- [ ] Al marcar retroactivo, recalcula racha desde esa fecha hasta hoy (crítico para integridad)
- [ ] Valida que el hábito debe realizarse en esa fecha según periodicidad

## Tareas Técnicas

- [ ] Crear endpoint `PUT /api/habits/:id/daily/:fecha` - [1h]
- [ ] Validar rango de fechas (7 días atrás) - [1h]
- [ ] Generar HabitoDelDia on-demand si no existe - [1h]
- [ ] Integrar con lógica de recálculo de rachas (US-031) - [1.5h]
- [ ] Tests unitarios y de integración - [2h]

## Componentes Afectados

- **backend:** HabitController, HabitService, StreakService

## Dependencias

- US-029 debe estar completa
- US-031 debe estar en progreso (algoritmo de rachas)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
