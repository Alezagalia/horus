# US-049: Endpoint de Reactivación de Hábitos

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-049
**Título:** Endpoint de Reactivación de Hábitos

## Descripción

Como usuario, quiero poder reactivar un hábito que desactivé previamente, para volver a incluirlo en mi rutina diaria sin perder el historial.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/habits/:id/reactivate` reactiva hábito desactivado
- [ ] Valida que hábito esté desactivado (isActive = false), devuelve 400 si ya está activo
- [ ] Al reactivar:
  - Set isActive = true
  - Generar HabitoDelDia desde hoy hasta +30 días según periodicidad
  - Reiniciar currentStreak = 0 (empieza racha nueva)
  - Mantener longestStreak (récord histórico no se pierde)
  - Crear registro HabitAudit con changeType = 'REACTIVATED'
- [ ] Devuelve 404 si hábito no existe o no pertenece al usuario autenticado
- [ ] Body opcional: `{ reason?: string }` para registrar razón de reactivación
- [ ] Respuesta incluye hábito actualizado con isActive = true
- [ ] Es idempotente (llamar múltiples veces al hábito activo devuelve 400 con mensaje claro)

## Tareas Técnicas

- [ ] Crear endpoint POST /api/habits/:id/reactivate - [1h]
- [ ] Validar estado actual del hábito (isActive = false) - [0.5h]
- [ ] Implementar lógica de reactivación (isActive, currentStreak, generar HabitoDelDia) - [2h]
- [ ] Crear registro de auditoría con reason opcional - [0.5h]
- [ ] Utilizar transacción Prisma - [1h]
- [ ] Tests unitarios de lógica de reactivación - [2h]
- [ ] Tests de edge cases (hábito ya activo, hábito no existe) - [1.5h]
- [ ] Documentación de API - [0.5h]

## Componentes Afectados

- **backend:** HabitController, HabitService, AuditService

## Dependencias

- US-046 debe estar completa (para registro de auditoría)
- Lógica de generación de HabitoDelDia del Sprint 3

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
