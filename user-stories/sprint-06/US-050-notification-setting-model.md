# US-050: Modelo NotificationSetting para Recordatorios

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-050
**Título:** Modelo NotificationSetting para Recordatorios

## Descripción

Como desarrollador del sistema, quiero un modelo de base de datos para almacenar configuraciones de notificaciones por hábito, para saber cuándo enviar recordatorios a cada usuario.

## Criterios de Aceptación

- [ ] Modelo `NotificationSetting` creado en schema de Prisma con campos:
  - id (UUID)
  - habitId (relación con Habit, UNIQUE)
  - userId (para queries rápidas)
  - enabled (boolean: si está habilitada la notificación)
  - time (string: hora en formato "HH:mm", ej: "08:00")
  - createdAt, updatedAt
- [ ] Restricción UNIQUE en habitId (un hábito solo tiene una configuración de notificación)
- [ ] Relación con Habit configurada (ON DELETE CASCADE)
- [ ] Índice en (userId, enabled) para cron job de notificaciones
- [ ] Migración de Prisma ejecutada exitosamente

## Tareas Técnicas

- [ ] Crear modelo NotificationSetting en `prisma/schema.prisma` - [1h]
- [ ] Agregar índices y constraints - [0.5h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Ejecutar migración en BD local y staging - [0.5h]
- [ ] Documentar modelo en comentarios - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations

## Dependencias

- Modelo Habit del Sprint 3

## Prioridad

high

## Esfuerzo Estimado

2 Story Points
