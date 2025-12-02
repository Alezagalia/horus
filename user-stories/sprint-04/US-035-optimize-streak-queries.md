# Technical Task #1: Optimización de Queries para Cálculo de Rachas

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** TECH-001
**Título:** Optimización de Queries para Cálculo de Rachas

## Descripción

Optimizar las queries de base de datos necesarias para calcular rachas de forma eficiente, especialmente cuando hay múltiples hábitos y registros históricos extensos.

## Razón

El cálculo de rachas puede volverse costoso si requiere leer todos los HabitRecord históricos. Es necesario optimizar con índices y queries inteligentes para mantener performance <100ms.

## Tareas Técnicas

- [ ] Crear índice compuesto en HabitRecord (habitId, date DESC) para búsquedas rápidas - [0.5h]
- [ ] Implementar query que solo lee últimos 30 días de registros para cálculo de racha - [1h]
- [ ] Cachear currentStreak y longestStreak en modelo Habit (ya denormalizado) - [0.5h]
- [ ] Benchmark de performance: cálculo de racha con 365 registros < 50ms - [1h]
- [ ] Documentar estrategia de optimización - [0.5h]

## Componentes Afectados

- **backend:** Database indexes, StreakService

## Dependencias

- US-031 (Algoritmo de rachas)

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
