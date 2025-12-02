# US-046: Modelo HabitAudit para Trazabilidad de Cambios

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-046
**Título:** Modelo HabitAudit para Trazabilidad de Cambios

## Descripción

Como desarrollador del sistema, quiero un modelo de base de datos que registre todos los cambios realizados a los hábitos, para proporcionar trazabilidad completa y permitir auditorías.

## Criterios de Aceptación

- [ ] Modelo `HabitAudit` creado en schema de Prisma con campos:
  - id (UUID)
  - habitId (relación con Habit)
  - userId (para queries rápidas)
  - changeType (enum: 'CREATED', 'UPDATED', 'DELETED', 'REACTIVATED')
  - fieldChanged (string: nombre del campo modificado, ej: "periodicity", "targetValue")
  - oldValue (string: valor anterior serializado como JSON)
  - newValue (string: valor nuevo serializado como JSON)
  - reason (string opcional: razón del cambio si el usuario la proporciona)
  - createdAt (timestamp del cambio)
- [ ] Relación con Habit configurada (ON DELETE CASCADE)
- [ ] Índice en (habitId, createdAt DESC) para queries de historial
- [ ] Índice en userId para queries de auditoría por usuario
- [ ] Migración de Prisma ejecutada exitosamente

## Tareas Técnicas

- [ ] Crear modelo HabitAudit en `prisma/schema.prisma` - [1h]
- [ ] Crear enum ChangeType para tipos de cambio - [0.5h]
- [ ] Agregar índices para performance - [0.5h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Ejecutar migración en BD local y staging - [0.5h]
- [ ] Documentar modelo en comentarios del schema - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations

## Dependencias

- Modelo Habit del Sprint 3

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
