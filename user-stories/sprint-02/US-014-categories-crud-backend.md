# US-014: Modelo de Categorías y CRUD Backend

**Sprint:** 02 - Categories (Backend + Mobile)
**ID:** US-014
**Título:** Modelo de Categorías y CRUD Backend

## Descripción

Como desarrollador backend, quiero crear el modelo de datos y endpoints CRUD para categorías para que usuarios puedan organizar hábitos, tareas, eventos y gastos.

## Criterios de Aceptación

- [ ] Modelo Category creado en Prisma con campos: id, userId, name, scope, icon, color, isDefault, isActive, createdAt, updatedAt
- [ ] Enum Scope con valores: habitos, tareas, eventos, gastos
- [ ] Migración de base de datos ejecutada
- [ ] Endpoint GET /api/categories?scope={scope} - lista categorías del usuario filtradas por scope
- [ ] Endpoint GET /api/categories/:id - obtiene categoría específica
- [ ] Endpoint POST /api/categories - crea nueva categoría
- [ ] Endpoint PUT /api/categories/:id - actualiza categoría
- [ ] Endpoint DELETE /api/categories/:id - soft delete (isActive = false)
- [ ] Endpoint PUT /api/categories/:id/set-default - marca como default
- [ ] Validaciones: name único por scope y usuario, color hex válido, scope obligatorio
- [ ] Solo una categoría default por scope
- [ ] Categorías protected con authMiddleware
- [ ] Seed de categorías default al registrar usuario

## Tareas Técnicas

- [ ] Crear modelo Category en Prisma - [1.5h]
- [ ] Crear enum Scope - [0.5h]
- [ ] Crear migración - [0.5h]
- [ ] Implementar CategoryController con CRUD - [3h]
- [ ] Implementar CategoryService - [2h]
- [ ] Validaciones con Zod - [1h]
- [ ] Endpoint set-default - [1h]
- [ ] Seed de categorías default - [1.5h]
- [ ] Tests unitarios - [2h]
- [ ] Documentación API - [0.5h]

## Componentes Afectados

- **backend:** CategoryController, CategoryService, Category model
- **database:** Category table

## Dependencias

- Sprint 01 (Auth system)

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
