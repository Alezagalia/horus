# US-151: Tipos y esquema Zod del módulo Timeline

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 16
**Story Points:** 2
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** equipo de desarrollo
**Quiero** tener tipos TypeScript y esquemas Zod compartidos para `TimelineEvent` en `packages/shared`
**Para** garantizar consistencia de payloads entre backend, web y mobile sin duplicar definiciones

---

## Contexto

Soporta la feature **F-16 Arqueología Personal** del backlog. El endpoint `/api/timeline` (US-152) y los clientes web (US-153) y mobile (US-154) consumen estos tipos.

---

## Criterios de Aceptación

### 1. Archivos creados

```
packages/shared/src/types/timeline.types.ts
packages/shared/src/schemas/timeline.schemas.ts
```

Ambos exportados desde el `index.ts` correspondiente.

### 2. Tipos exportados

```typescript
export type TimelineModule = 'habits' | 'tasks' | 'workouts' | 'goals' | 'finance' | 'resources';

export type TimelineEventCategory =
  | 'first' // primera vez en un dominio
  | 'completed' // hito de cierre (meta completada, racha alcanzada)
  | 'anniversary' // aniversario exacto (1m, 3m, 6m, 1y, 2y...)
  | 'milestone'; // número redondo (100, 500, 1000)

export interface TimelineEvent {
  id: string; // estable: `${category}.${kind}.${entityId}`
  module: TimelineModule;
  category: TimelineEventCategory;
  kind: string; // ej: 'habit.created', 'goal.completed', 'tasks.100'
  date: string; // ISO date YYYY-MM-DD del evento original
  title: string; // texto principal localizado en español
  description?: string; // detalle opcional
  entity?: {
    type: TimelineModule;
    id: string;
    name?: string;
  };
  anniversary?: {
    yearsAgo?: number;
    monthsAgo?: number;
  };
}

export interface TimelineResponse {
  events: TimelineEvent[]; // orden descendente por date
  total: number;
  hasMore: boolean;
}
```

### 3. Esquema Zod

`timeline.schemas.ts` exporta `timelineQuerySchema`:

- `from`: ISO date opcional (default: sin límite inferior)
- `to`: ISO date opcional (default: hoy)
- `modules`: lista separada por coma de TimelineModule (default: todos)
- `categories`: lista separada por coma de TimelineEventCategory (default: todos)
- `limit`: number opcional 1..200 (default 100)
- `offset`: number opcional 0+ (default 0)

Las listas deben aceptar tanto array como string CSV (igual que `compareQuerySchema` de US-141).

### 4. Tests

`packages/shared/src/schemas/__tests__/timeline.schemas.test.ts` (cuando exista infra de tests en shared):

- Rechaza módulo desconocido
- Rechaza categoría desconocida
- Acepta CSV `modules=habits,tasks`
- Acepta array `modules=['habits','tasks']`
- Aplica defaults

---

## Tareas Técnicas

1. **Crear `timeline.types.ts`** — [0.75h]
2. **Crear `timeline.schemas.ts`** — [1h]
3. **Exportar desde shared `index.ts`** — [0.25h]
4. **Build y verificación de tipos** — [0.5h]
5. **Tests (si infra disponible)** — [0.5h]

---

## Definition of Done

- [ ] Tipos exportados desde `@horus/shared`
- [ ] Esquema Zod exportado desde `@horus/shared`
- [ ] `pnpm --filter @horus/shared build` exitoso
- [ ] `pnpm --filter @horus/shared type-check` exitoso
- [ ] Code review aprobado

---

**Estimación:** 2 SP | 3h
**Bloqueante de:** US-152, US-153, US-154
