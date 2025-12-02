# US-021: Modelo de Hábitos y Endpoints CRUD (Backend)

**Sprint:** 03 - Habits CRUD (Backend + Mobile)
**ID:** US-021
**Título:** Modelo de Hábitos y Endpoints CRUD (Backend)

## Descripción

Como desarrollador backend, quiero crear el modelo de datos de hábitos y los endpoints CRUD para que los usuarios puedan gestionar sus hábitos.

## Criterios de Aceptación

- [ ] Modelo Habit en Prisma con campos: id, userId, categoryId, name, description, type (CHECK/NUMERIC), targetValue, unit, periodicity, weekDays, timeOfDay, reminderTime, color, order, isActive, createdAt, updatedAt
- [ ] Enum HabitType: CHECK, NUMERIC
- [ ] Enum Periodicity: DAILY, WEEKLY, MONTHLY, CUSTOM
- [ ] Enum TimeOfDay: MANANA, TARDE, NOCHE, ANYTIME
- [ ] Relación con Category (categoryId → Category.id)
- [ ] Migración ejecutada
- [ ] GET /api/habits - lista hábitos activos del usuario
- [ ] GET /api/habits/:id - obtiene hábito específico
- [ ] POST /api/habits - crea nuevo hábito
- [ ] PUT /api/habits/:id - actualiza hábito
- [ ] DELETE /api/habits/:id - soft delete
- [ ] Validaciones: name obligatorio, type obligatorio, targetValue si NUMERIC, weekDays si WEEKLY
- [ ] Protected con authMiddleware
- [ ] Tests unitarios >80%

## Tareas Técnicas

- [ ] Crear modelo Habit en Prisma - [2h]
- [ ] Crear enums necesarios - [1h]
- [ ] Crear migración - [0.5h]
- [ ] Implementar HabitController CRUD - [3h]
- [ ] Implementar HabitService - [2.5h]
- [ ] Validaciones con Zod - [1.5h]
- [ ] Tests unitarios - [2.5h]
- [ ] Documentación API - [0.5h]

## Componentes Afectados

- **backend:** HabitController, HabitService, Habit model
- **database:** Habit table

## Dependencias

- Sprint 01 (Auth)
- Sprint 02 (Categories)

## Prioridad

critical

## Esfuerzo Estimado

8 Story Points
