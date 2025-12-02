# US-029: Endpoint para Registrar Cumplimiento de Hábito

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-029
**Título:** Endpoint para Registrar Cumplimiento de Hábito

## Descripción

Como usuario, quiero poder marcar un hábito como completado desde la aplicación, para registrar mi progreso diario y mantener mi racha activa.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/habits/:id/records` crea/actualiza HabitRecord para la fecha actual
- [ ] Para hábitos CHECK: solo marca completed = true/false
- [ ] Para hábitos NUMERIC: valida que value esté entre 0 y targetValue (o ilimitado si no tiene target)
- [ ] Actualiza simultáneamente el registro correspondiente en HabitoDelDia (completado, valorActual)
- [ ] Devuelve 400 si se intenta marcar un hábito que no debe realizarse ese día según periodicidad
- [ ] Devuelve 404 si el hábito no existe o no pertenece al usuario autenticado
- [ ] Endpoint es idempotente (múltiples llamadas con mismo valor no generan errores)
- [ ] Validación con Zod schema antes de crear registro

## Tareas Técnicas

- [ ] Crear controller `habits.controller.ts::createOrUpdateRecord()` - [2h]
- [ ] Implementar validación de periodicidad (verificar que hoy debe realizarse) - [1h]
- [ ] Crear Zod schema `RecordHabitSchema` con validaciones - [1h]
- [ ] Transacción Prisma para actualizar HabitRecord + HabitoDelDia atómicamente - [2h]
- [ ] Manejo de errores específicos (404, 400, 403) - [1h]
- [ ] Agregar rate limiting (max 100 requests/minuto por usuario) - [0.5h]
- [ ] Tests unitarios del controller (>80% coverage) - [2h]

## Componentes Afectados

- **backend:** HabitController, HabitService, Validation schemas

## Dependencias

- US-028 debe estar completa primero
- Modelo HabitoDelDia del Sprint 3

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
