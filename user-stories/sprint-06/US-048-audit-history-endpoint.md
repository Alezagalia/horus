# US-048: Endpoint de Historial de Cambios

**Sprint:** 06 - Auditoría + Reactivación + Notificaciones Básicas
**ID:** US-048
**Título:** Endpoint de Historial de Cambios

## Descripción

Como usuario, quiero obtener el historial de cambios de un hábito específico, para ver qué modificaciones realicé y cuándo.

## Criterios de Aceptación

- [ ] Endpoint `GET /api/habits/:id/audit` devuelve historial de cambios del hábito
- [ ] Respuesta ordenada por createdAt DESC (más reciente primero)
- [ ] Cada registro incluye: changeType, fieldChanged, oldValue, newValue, reason, createdAt
- [ ] Devuelve 404 si hábito no existe o no pertenece al usuario autenticado
- [ ] Paginación: parámetro query `limit` (default: 50, max: 100)
- [ ] Formato de oldValue/newValue deserializado y legible (no JSON crudo)
- [ ] Response time < 200ms

## Tareas Técnicas

- [ ] Crear endpoint GET /api/habits/:id/audit - [1h]
- [ ] Implementar query con Prisma (orderBy, take, skip) - [1h]
- [ ] Validación de ownership (hábito pertenece al usuario) - [0.5h]
- [ ] Deserialización de oldValue/newValue para respuesta legible - [1.5h]
- [ ] Tests de endpoint con diferentes tipos de cambios - [2h]
- [ ] Documentación de API en Swagger - [0.5h]

## Componentes Afectados

- **backend:** AuditController, API routes

## Dependencias

- US-047 debe estar completa (para tener datos de auditoría)

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
