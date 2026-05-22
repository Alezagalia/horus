# US-143: Endpoint de Heatmap Anual de Hábitos

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 5
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** ver mi adherencia a hábitos a lo largo de un año entero en un mapa de calor estilo GitHub contributions
**Para** identificar de un vistazo períodos buenos, recaídas y tendencias estacionales

---

## Criterios de Aceptación

### 1. Endpoint

`GET /api/analytics/habits/heatmap?year=YYYY`

- Requiere `authMiddleware`.
- Valida query con `heatmapQuerySchema` (US-141): `year` entre 2020 y año actual.
- Default: año actual si no se envía `year`.

### 2. Response 200

```json
{
  "year": 2026,
  "totalCompletions": 1240,
  "bestDay": { "date": "2026-03-14", "completions": 9 },
  "days": [
    { "date": "2026-01-01", "completions": 3, "level": 1 },
    { "date": "2026-01-02", "completions": 5, "level": 2 },
    { "date": "2026-01-03", "completions": 0, "level": 0 }
  ]
}
```

### 3. Reglas de cálculo

- **`days`**: siempre 365 entradas (o 366 en años bisiestos), en orden ascendente, sin huecos. Días sin completitudes devuelven `completions: 0` y `level: 0`.
- **`completions` por día**: count de `HabitRecord` con `completed=true` y `date == day` para el usuario autenticado.
- **`level`** (0 a 4): escala dinámica por usuario según percentil de su distribución del año.
  - Algoritmo:
    1. Calcular `max = maxCompletionsEnUnDía` del año.
    2. Si `max == 0`: todos los días tienen `level: 0`.
    3. Caso contrario, bins: `[0]→0`, `(0..max/4]→1`, `(max/4..max/2]→2`, `(max/2..3max/4]→3`, `(3max/4..max]→4`.
- **`bestDay`**: día con más completitudes; `null` si no hubo ninguna.
- **`totalCompletions`**: suma de `completions` de todos los días.

### 4. Performance

- Query única agrupada por día (`groupBy { date: true, _count: ... }`) — evitar N+1.
- p95 < 400ms con 365 días × 12 hábitos activos.
- Cachear en memoria por 60 segundos por `(userId, year)` para evitar recalcular en navegación rápida.

### 5. Errores

- `401` no autenticado.
- `400` si `year` fuera de rango o no es entero.
- `500` con logging en Sentry.

---

## Tareas Técnicas

1. **Función `buildHabitHeatmap(userId, year)` en `analytics.service.ts`** — [2h]
2. **Algoritmo de bucketing dinámico para `level`** — [1h]
3. **Handler en `analytics.controller.ts` (`getHabitsHeatmap`)** — [0.5h]
4. **Registrar ruta en `analytics.routes.ts`** — [0.25h]
5. **Implementar cache en memoria (LRU 60s)** — [1h]
6. **Tests unitarios del builder y del bucketing** — [2h]
7. **Test de integración con Supertest** — [1h]

---

## Definition of Done

- [ ] Endpoint disponible en `/api/analytics/habits/heatmap`
- [ ] Devuelve siempre 365/366 días, sin huecos
- [ ] Tests cubren año bisiesto y año sin completitudes
- [ ] p95 < 400ms en staging
- [ ] Cache 60s funcionando (verificable con métricas)
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 5 SP | 7.75h
**Bloqueada por:** US-141
**Bloqueante de:** US-148
