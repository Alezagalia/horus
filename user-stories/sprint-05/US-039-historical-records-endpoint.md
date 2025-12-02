# US-039: Endpoint de Registros Históricos con Filtros

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-039
**Título:** Endpoint de Registros Históricos con Filtros

## Descripción

Como usuario avanzado o para debugging, quiero obtener el historial completo de registros de un hábito con filtros de fecha, para analizar patrones específicos o exportar datos.

## Criterios de Aceptación

- [ ] Endpoint `GET /api/habits/:id/records?from=YYYY-MM-DD&to=YYYY-MM-DD` devuelve registros históricos
- [ ] Parámetros query opcionales:
  - `from`: Fecha inicio (default: 30 días atrás)
  - `to`: Fecha fin (default: hoy)
- [ ] Devuelve array de HabitRecord ordenados por fecha DESC
- [ ] Cada registro incluye: id, date, completed, value, notes, createdAt
- [ ] Valida formato de fechas (YYYY-MM-DD), devuelve 400 si formato incorrecto
- [ ] Valida que `from` <= `to`, devuelve 400 si no cumple
- [ ] Limita rango máximo a 365 días (devuelve 400 si excede)
- [ ] Paginación: máximo 100 registros por request
- [ ] Devuelve 404 si hábito no existe o no pertenece al usuario

## Tareas Técnicas

- [ ] Crear controller `getHabitRecords(habitId, from, to)` - [1h]
- [ ] Implementar validación de fechas con Zod schema - [1h]
- [ ] Implementar paginación (limit 100, offset opcional) - [1h]
- [ ] Query con Prisma: where, orderBy, take, skip - [0.5h]
- [ ] Tests de validación de parámetros - [1.5h]
- [ ] Tests con diferentes rangos de fechas - [1h]
- [ ] Documentación de API con ejemplos - [0.5h]

## Componentes Afectados

- **backend:** HabitController, Validation schemas

## Dependencias

- Modelo HabitRecord del Sprint 4

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
