# US-065: Modelos Event y SyncSetting en Base de Datos

**Sprint:** 08 - Eventos de Calendario + Sincronización con Google
**ID:** US-065
**Título:** Modelos Event y SyncSetting en Base de Datos

## Descripción

Como desarrollador del sistema, quiero modelos de base de datos para eventos y configuración de sincronización con Google, para almacenar eventos y gestionar la integración con Google Calendar.

## Criterios de Aceptación

- [ ] Modelo `Event` creado en schema de Prisma con campos:
  - id, title (string, max 200), description (text, nullable)
  - categoryId (relación con Category de scope 'eventos')
  - userId (relación con User)
  - location (string, nullable, max 200)
  - startDateTime (datetime)
  - endDateTime (datetime)
  - isAllDay (boolean, default: false)
  - isRecurring (boolean, default: false)
  - rrule (string, nullable - formato RRULE RFC 5545)
  - recurringEventId (string, nullable - si es instancia de evento recurrente)
  - status (enum: 'pendiente', 'completado', 'cancelado', default: 'pendiente')
  - completedAt, canceledAt, archivedAt (datetime, nullable)
  - syncWithGoogle (boolean, default: true)
  - googleEventId (string, nullable, unique)
  - reminderMinutes (int, nullable - minutos antes para notificar)
  - notificationSent (boolean, default: false)
  - createdAt, updatedAt
- [ ] Modelo `SyncSetting` creado con campos:
  - id, userId (unique - un registro por usuario)
  - googleCalendarEnabled (boolean, default: false)
  - googleAccessToken (string, nullable, encrypted)
  - googleRefreshToken (string, nullable, encrypted)
  - googleTokenExpiresAt (datetime, nullable)
  - lastSyncAt (datetime, nullable)
  - createdAt, updatedAt
- [ ] Relaciones configuradas:
  - Event → Category (ON DELETE RESTRICT)
  - Event → User (ON DELETE CASCADE)
  - Event → Event (recurringEventId, self-relation)
  - SyncSetting → User (ON DELETE CASCADE)
- [ ] Índices creados:
  - (userId, startDateTime, endDateTime) para queries de rango
  - (googleEventId) único para sincronización
  - (userId, status, archivedAt) para filtros
  - (userId, syncWithGoogle) para job de sincronización
- [ ] Migración de Prisma ejecutada exitosamente

## Tareas Técnicas

- [ ] Crear modelo Event en `prisma/schema.prisma` - [2h]
- [ ] Crear modelo SyncSetting con campos encrypted - [1h]
- [ ] Crear enum EventStatus - [0.5h]
- [ ] Agregar índices y relaciones - [1h]
- [ ] Configurar encryption para tokens de Google (usar prisma-field-encryption) - [1.5h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Ejecutar migración en BD local y staging - [0.5h]
- [ ] Documentar modelos en comentarios - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations, Encryption utilities

## Dependencias

- Modelo Category del Sprint 2
- Librería de encryption para tokens

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
