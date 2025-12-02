# Technical Task #1: Función de Cálculo de Color Semáforo Compartida

**Sprint:** 07 - Gestión de Tareas
**ID:** TECH-001
**Título:** Función de Cálculo de Color Semáforo Compartida

## Descripción

Crear función compartida (en `packages/shared`) para calcular color de tarea según fecha de vencimiento, reutilizable en backend (para incluir en respuesta API) y frontend (para cálculo local).

## Razón

Evitar duplicación de lógica entre backend y frontend. El cálculo es complejo y debe ser idéntico en ambos lados.

## Tareas Técnicas

- [ ] Crear función `calculateTaskColor(dueDate, status)` en `packages/shared/src/utils/taskColors.ts` - [1h]
- [ ] Exportar tipos: TaskColor, TaskStatus - [0.5h]
- [ ] Escribir tests exhaustivos (todos los casos del semáforo) - [1.5h]
- [ ] Documentar función con JSDoc - [0.5h]
- [ ] Usar función en backend (incluir en respuesta de GET /api/tasks) - [0.5h]
- [ ] Usar función en mobile (TaskCard) - [0.5h]

## Componentes Afectados

- **shared:** Task color utilities
- **backend:** TaskController
- **mobile:** TaskCard component

## Dependencias

- Ninguna

## Prioridad

medium

## Esfuerzo Estimado

1 Story Point
