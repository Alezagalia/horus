# US-110: Optimización de Backend (Índices, N+1, Caching)

**Sprint:** 12 - MVP Completo: Notificaciones Push + Performance + Tests E2E
**ID:** US-110
**Título:** Optimización de Backend (Índices, N+1, Caching)
**Tipo:** Backend

## Descripción

Como desarrollador backend, quiero optimizar queries y agregar caching, para mejorar performance del API.

## Razón

Un backend lento afecta todas las plataformas (mobile + web). Response times < 500ms son críticos para una buena experiencia de usuario.

## Criterios de Aceptación

### 1. Índices de BD

- [ ] Auditar todos los modelos Prisma
- [ ] Agregar índices en campos frecuentes (userId, date, status, etc.)
- [ ] Índices compuestos donde necesario
- [ ] Verificar índices en BD real con EXPLAIN

### 2. Eliminación de N+1 Queries

- [ ] Auditar todos los endpoints
- [ ] Usar `include` en lugar de queries anidados
- [ ] Logging de queries lentas (>100ms)
- [ ] Validar con herramientas de profiling

### 3. Query Optimization

- [ ] Select solo campos necesarios (evitar SELECT \*)
- [ ] Paginación en endpoints de lista
- [ ] Limitar cantidad de resultados por defecto

### 4. Caching con Redis (opcional)

- [ ] Cache de hábitos del día (TTL 5 min)
- [ ] Cache de estadísticas (TTL 10 min)
- [ ] Cache de categorías (TTL 30 min)
- [ ] Invalidación al modificar datos

### 5. Connection Pooling

- [ ] Prisma connection pooling configurado
- [ ] Límites apropiados (max 10-20 connections)

### 6. Monitoreo

- [ ] Logging de response times
- [ ] Alertas si response > 1s
- [ ] Métricas de queries lentas

## Tareas Técnicas

- [ ] Auditoría de índices - [1h]
- [ ] Agregar índices faltantes - [1h]
- [ ] Auditoría N+1 queries - [1.5h]
- [ ] Refactorizar queries - [1.5h]
- [ ] Paginación en listas - [1h]
- [ ] Redis y caching (opcional) - [2h]
- [ ] Logging performance - [1h]
- [ ] Documentar - [0.5h]

## Componentes Afectados

- **backend:** Prisma schema, queries, endpoints, caching layer, monitoring

## Dependencias

- Ninguna

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
