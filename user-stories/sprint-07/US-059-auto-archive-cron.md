# US-059: Cron Job de Archivado Automático

**Sprint:** 07 - Gestión de Tareas
**ID:** US-059
**Título:** Cron Job de Archivado Automático

## Descripción

Como sistema, quiero archivar automáticamente tareas completadas después de 24 horas, para mantener la lista de tareas limpia y enfocada en lo actual.

## Criterios de Aceptación

- [ ] Cron job se ejecuta diariamente a las 00:01
- [ ] Query: busca tareas con status = 'completada' y completedAt < now() - 24h y archivedAt = null
- [ ] Actualiza archivedAt = now() para todas las tareas encontradas
- [ ] Logging de cantidad de tareas archivadas
- [ ] No afecta performance (query optimizada con índices)
- [ ] Manejo de errores robusto (continuar si falla una tarea)

## Tareas Técnicas

- [ ] Crear cron job en `jobs/archive-tasks.job.ts` - [1h]
- [ ] Implementar query optimizada con Prisma - [1h]
- [ ] Configurar scheduling con node-cron o agenda.js - [1h]
- [ ] Implementar logging detallado - [0.5h]
- [ ] Tests del cron job con datos mock - [1.5h]
- [ ] Configurar job en entorno de staging - [0.5h]

## Componentes Afectados

- **backend:** Cron jobs, TaskService

## Dependencias

- US-057 debe estar completa

## Prioridad

medium

## Esfuerzo Estimado

2 Story Points
