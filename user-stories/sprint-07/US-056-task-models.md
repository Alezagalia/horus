# US-056: Modelos Task y TaskChecklistItem en Base de Datos

**Sprint:** 07 - Gestión de Tareas
**ID:** US-056
**Título:** Modelos Task y TaskChecklistItem en Base de Datos

## Descripción

Como desarrollador del sistema, quiero modelos de base de datos para tareas y checklist, para almacenar y gestionar tareas con todas sus propiedades.

## Criterios de Aceptación

- [ ] Modelo `Task` creado en schema de Prisma con campos:
  - id, title (string, max 200), description (text, nullable)
  - categoryId (relación con Category de scope 'tareas')
  - userId (relación con User)
  - priority (enum: 'alta', 'media', 'baja', default: 'media')
  - status (enum: 'pendiente', 'en_progreso', 'completada', 'cancelada', default: 'pendiente')
  - dueDate (datetime, nullable)
  - completedAt, canceledAt, archivedAt (datetime, nullable)
  - cancelReason (string, nullable, max 200)
  - isActive (boolean, default: true)
  - orderPosition (int, para ordenamiento custom)
  - createdAt, updatedAt
- [ ] Modelo `TaskChecklistItem` creado con campos:
  - id, taskId (relación con Task)
  - title (string, max 200)
  - completed (boolean, default: false)
  - position (int, para ordenamiento)
  - createdAt, updatedAt
- [ ] Relaciones configuradas:
  - Task → Category (ON DELETE RESTRICT)
  - Task → User (ON DELETE CASCADE)
  - TaskChecklistItem → Task (ON DELETE CASCADE)
- [ ] Índices creados:
  - (userId, isActive, status) para queries de listado
  - (userId, dueDate) para filtros por fecha
  - (taskId, position) para checklist ordenado
- [ ] Migración de Prisma ejecutada exitosamente

## Tareas Técnicas

- [ ] Crear modelo Task en `prisma/schema.prisma` - [1.5h]
- [ ] Crear modelo TaskChecklistItem - [0.5h]
- [ ] Crear enums Priority y TaskStatus - [0.5h]
- [ ] Agregar índices y relaciones - [1h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Ejecutar migración en BD local y staging - [0.5h]
- [ ] Documentar modelos en comentarios - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations

## Dependencias

- Modelo Category del Sprint 2

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
