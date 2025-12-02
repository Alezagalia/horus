# US-047: Registro Automático de Cambios en Hábitos

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-047
**Título:** Registro Automático de Cambios en Hábitos

## Descripción

Como usuario, quiero que todos los cambios que realizo en mis hábitos se registren automáticamente, para poder revisar qué modifiqué y cuándo lo hice.

## Criterios de Aceptación

- [ ] Al crear hábito: crear registro HabitAudit con changeType = 'CREATED'
- [ ] Al editar hábito: crear registro por cada campo modificado
- [ ] Campos que se auditan:
  - `name`, `description`, `periodicity`, `weeklyDays`, `customDays`
  - `timeOfDay`, `color`, `targetValue`, `unit`, `categoryId`
- [ ] Si se modifica `periodicity`:
  - Crear HabitAudit con oldValue/newValue
  - Borrar todos los HabitoDelDia futuros (fecha > hoy)
  - Regenerar HabitoDelDia para próximos 30 días con nueva periodicidad
- [ ] Si se modifica `targetValue` (hábitos NUMERIC):
  - Crear HabitAudit con oldValue/newValue
  - Actualizar HabitoDelDia futuros con nuevo targetValue
  - **NO modificar** registros históricos (HabitRecord)
- [ ] Al desactivar hábito (soft delete): crear registro con changeType = 'DELETED'
- [ ] Serialización correcta de valores complejos (arrays, objetos) como JSON
- [ ] Transacciones atómicas: cambio en Habit + creación de HabitAudit + regeneración de HabitoDelDia

## Tareas Técnicas

- [ ] Crear service `audit.service.ts` con función `createAuditLog()` - [2h]
- [ ] Modificar endpoint PUT /api/habits/:id para detectar cambios - [2h]
- [ ] Implementar lógica de regeneración de HabitoDelDia al cambiar periodicidad - [2h]
- [ ] Implementar lógica de actualización de HabitoDelDia al cambiar targetValue - [1.5h]
- [ ] Utilizar transacciones Prisma para atomicidad - [1h]
- [ ] Tests unitarios de createAuditLog() - [2h]
- [ ] Tests de integración de cambio de periodicidad (verificar regeneración) - [3h]
- [ ] Tests de cambio de targetValue (verificar no afecta históricos) - [2h]

## Componentes Afectados

- **backend:** AuditService, HabitController, HabitService

## Dependencias

- US-046 debe estar completa
- Lógica de generación de HabitoDelDia del Sprint 3

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
