# Technical Task #2: Cron Job para Auto-completar Hábitos Numéricos

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** TECH-002
**Título:** Cron Job para Auto-completar Hábitos Numéricos

## Descripción

Crear un cron job que diariamente (a las 00:01) verifique hábitos numéricos que alcanzaron el targetValue durante el día y los marque como completados si aún no lo están.

## Razón

Asegurar consistencia en el sistema: si un usuario ingresó valorActual >= targetValue pero el flag completed no se actualizó (por bug o error de red), el cron lo corrige.

## Tareas Técnicas

- [ ] Crear cron job en `jobs/auto-complete-habits.job.ts` - [1h]
- [ ] Query: buscar HabitRecord donde value >= targetValue y completed = false - [0.5h]
- [ ] Actualizar HabitoDelDia y recalcular racha si es necesario - [1h]
- [ ] Configurar cron con node-cron o agenda.js - [0.5h]
- [ ] Tests del cron job - [1h]
- [ ] Logging de auto-completados para auditoría - [0.5h]

## Componentes Afectados

- **backend:** Cron jobs, HabitService, StreakService

## Dependencias

- US-029, US-031 y US-032

## Prioridad

medium

## Esfuerzo Estimado

2 Story Points
