# US-141: Tipos y esquemas Zod del módulo Analytics

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 2
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** equipo de desarrollo
**Quiero** tener tipos TypeScript y esquemas Zod compartidos para el módulo Analytics en `packages/shared`
**Para** garantizar consistencia de payloads entre backend, web y mobile sin duplicar definiciones

---

## Contexto

Este módulo soporta la feature **F-07 Reportes y Tendencias** del backlog. Todos los endpoints expuestos por las US-142 a US-146 importan sus tipos y validan sus query params desde este paquete.

---

## Criterios de Aceptación

### 1. Archivos creados

```
packages/shared/src/types/analytics.types.ts
packages/shared/src/schemas/analytics.schemas.ts
```

Ambos exportados desde el `index.ts` correspondiente.

### 2. Tipos exportados

```typescript
// Período común a todas las respuestas
export interface AnalyticsPeriod {
  from: string; // ISO date YYYY-MM-DD
  to: string; // ISO date YYYY-MM-DD
  days: number;
}

// US-142: Overview
export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  habits: {
    totalCompletions: number;
    uniqueHabitsCompleted: number;
    completionRate: number; // 0..1
    longestStreakInPeriod: number;
  };
  tasks: {
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  finance: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
  };
  workouts: {
    completed: number;
    totalVolume: number;
  };
  goals: {
    active: number;
    completedInPeriod: number;
    averageProgress: number; // 0..1
  };
}

// US-143: Heatmap de hábitos
export interface HabitHeatmapDay {
  date: string; // YYYY-MM-DD
  completions: number;
  level: 0 | 1 | 2 | 3 | 4; // intensidad para color
}

export interface HabitHeatmap {
  year: number;
  totalCompletions: number;
  bestDay: { date: string; completions: number } | null;
  days: HabitHeatmapDay[]; // siempre 365 o 366 entradas
}

// US-144: Tendencias de finanzas
export interface FinanceTrendCategoryPoint {
  month: string; // YYYY-MM
  amount: number;
}

export interface FinanceTrendCategorySeries {
  categoryId: string;
  categoryName: string;
  color: string | null;
  points: FinanceTrendCategoryPoint[];
}

export interface FinanceTrendsProjection {
  month: string; // YYYY-MM (mes en curso)
  projectedTotal: number;
  daysElapsed: number;
  daysInMonth: number;
}

export interface FinanceTrends {
  months: string[]; // YYYY-MM, orden ascendente
  series: FinanceTrendCategorySeries[];
  projection: FinanceTrendsProjection | null;
}

// US-145: Productividad
export interface ProductivityDayOfWeek {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo
  completed: number;
}

export interface ProductivityHourOfDay {
  hour: number; // 0..23
  completed: number;
}

export interface ProductivityHeatmapCell {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  hour: number;
  completed: number;
}

export interface Productivity {
  period: AnalyticsPeriod;
  totalCompleted: number;
  byDayOfWeek: ProductivityDayOfWeek[];
  byHourOfDay: ProductivityHourOfDay[];
  heatmap: ProductivityHeatmapCell[];
  bestDayOfWeek: ProductivityDayOfWeek | null;
  bestHour: ProductivityHourOfDay | null;
}

// US-146: Comparar períodos
export type ComparableDimension =
  | 'habits.completions'
  | 'tasks.completed'
  | 'finance.expense'
  | 'finance.income'
  | 'workouts.completed';

export interface ComparisonValue {
  current: number;
  previous: number;
  delta: number; // current - previous
  deltaPercentage: number | null; // null si previous = 0
}

export interface PeriodComparison {
  current: AnalyticsPeriod;
  previous: AnalyticsPeriod;
  metrics: Record<ComparableDimension, ComparisonValue>;
}
```

### 3. Esquemas Zod

`analytics.schemas.ts` debe exportar:

- `analyticsRangeQuerySchema` — valida `{ from: string ISO date, to: string ISO date }`, `from <= to`, ventana máxima 366 días.
- `heatmapQuerySchema` — valida `{ year: number }`, entre 2020 y año actual.
- `financeTrendsQuerySchema` — valida `{ months: number }`, entre 1 y 24, default 6.
- `compareQuerySchema` — valida los cuatro endpoints de rango + array de `dimensions: ComparableDimension[]`.

Todos los esquemas usan `z.coerce` cuando vienen como query string.

### 4. Tests unitarios

`packages/shared/src/schemas/__tests__/analytics.schemas.test.ts`:

- Rechaza `from > to`
- Rechaza ventanas > 366 días
- Acepta y normaliza fechas ISO válidas
- Rechaza `year` fuera de rango
- Rechaza `months` fuera de rango
- Rechaza dimensiones desconocidas en `compareQuerySchema`

---

## Tareas Técnicas

1. **Crear `analytics.types.ts` con todos los tipos** — [1h]
2. **Crear `analytics.schemas.ts` con esquemas Zod** — [1h]
3. **Exportar desde index.ts de shared** — [0.25h]
4. **Tests unitarios de esquemas** — [1h]
5. **Build y verificación de tipos** — [0.25h]

---

## Definition of Done

- [ ] Tipos exportados desde `@horus/shared`
- [ ] Esquemas Zod exportados desde `@horus/shared`
- [ ] `pnpm --filter @horus/shared build` exitoso
- [ ] `pnpm --filter @horus/shared type-check` exitoso
- [ ] Tests > 80% cobertura en `analytics.schemas.ts`
- [ ] Code review aprobado

---

**Estimación:** 2 SP | 3.5h
**Bloqueante de:** US-142, US-143, US-144, US-145, US-146
