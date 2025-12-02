# US-032: Progreso Parcial para Hábitos Numéricos Acumulativos

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-032
**Título:** Progreso Parcial para Hábitos Numéricos Acumulativos

## Descripción

Como usuario con hábitos numéricos acumulativos (ej: "Beber 8 vasos de agua"), quiero poder actualizar el progreso de forma incremental durante el día, para no tener que ingresar el valor completo de una sola vez.

## Criterios de Aceptación

- [ ] Endpoint `PUT /api/habits/:id/daily/:fecha/progress` permite actualizar valorActual incrementalmente
- [ ] Body: `{ increment: number }` (puede ser positivo o negativo para correcciones)
- [ ] Valida que valorActual + increment no exceda targetValue (si está definido)
- [ ] Valida que valorActual no sea negativo después del decremento
- [ ] Si valorActual alcanza targetValue: automáticamente marca completed = true
- [ ] Actualiza HabitoDelDia.valorActual y HabitRecord.value
- [ ] Permite múltiples actualizaciones en el mismo día
- [ ] Devuelve el estado actualizado (valorActual, completed, porcentaje de progreso)

## Tareas Técnicas

- [ ] Crear endpoint `PUT /api/habits/:id/daily/:fecha/progress` - [1.5h]
- [ ] Implementar lógica de incremento/decremento con validaciones - [1.5h]
- [ ] Auto-completado cuando valorActual >= targetValue - [1h]
- [ ] Tests de incrementos múltiples en el mismo día - [1.5h]
- [ ] Tests de edge cases (exceder target, valores negativos) - [1h]

## Componentes Afectados

- **backend:** HabitController, HabitService

## Dependencias

- US-029 debe estar completa

## Prioridad

medium

## Esfuerzo Estimado

5 Story Points
