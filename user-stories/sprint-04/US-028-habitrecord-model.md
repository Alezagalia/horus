# US-028: Modelo HabitRecord para Registro Histórico

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-028
**Título:** Modelo HabitRecord para Registro Histórico

## Descripción

Como desarrollador del sistema, quiero un modelo de base de datos que registre cada vez que un usuario completa un hábito, para mantener un historial completo de cumplimientos y poder calcular rachas y estadísticas.

## Criterios de Aceptación

- [ ] Modelo `HabitRecord` creado en schema de Prisma con campos: id, habitId, userId, date, completed, value, notes, createdAt, updatedAt
- [ ] Índice único en (habitId, userId, date) para evitar registros duplicados del mismo día
- [ ] Relación con Habit configurada (ON DELETE CASCADE)
- [ ] Campo `value` acepta números decimales para hábitos NUMERIC (ej: 74.5 kg)
- [ ] Campo `notes` opcional para observaciones del usuario (max 500 caracteres)
- [ ] Migración de Prisma ejecutada exitosamente en local y staging

## Tareas Técnicas

- [ ] Crear modelo HabitRecord en `prisma/schema.prisma` - [1h]
- [ ] Agregar índices (habitId, userId, date) para performance - [0.5h]
- [ ] Crear migración de Prisma - [0.5h]
- [ ] Ejecutar migración en BD local - [0.5h]
- [ ] Validar schema con `prisma validate` - [0.5h]
- [ ] Documentar modelo en comentarios de schema - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, Database migrations

## Dependencias

- Requiere modelo Habit completado (Sprint 3)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
