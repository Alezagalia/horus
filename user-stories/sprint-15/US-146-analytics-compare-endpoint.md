# US-146: Endpoint de Comparación entre Períodos

**Tipo:** user-story
**Prioridad:** medium
**Sprint:** 15
**Story Points:** 4
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** comparar dos períodos de tiempo (esta semana vs la pasada, este mes vs el anterior, etc.)
**Para** medir mi evolución relativa y detectar mejoras o retrocesos

---

## Criterios de Aceptación

### 1. Endpoint

`GET /api/analytics/compare?currentFrom=&currentTo=&previousFrom=&previousTo=&dimensions=habits.completions,tasks.completed`

- Requiere `authMiddleware`.
- Valida query con `compareQuerySchema` (US-141).
- `dimensions`: lista separada por coma. Si está ausente, devuelve TODAS las dimensiones soportadas.
- Cada rango se valida independientemente; ambos pueden tener longitudes distintas, pero se emite warning header `X-Analytics-Warning: period-length-mismatch` si difieren en > 1 día.

### 2. Response 200

```json
{
  "current": { "from": "2026-05-15", "to": "2026-05-21", "days": 7 },
  "previous": { "from": "2026-05-08", "to": "2026-05-14", "days": 7 },
  "metrics": {
    "habits.completions": {
      "current": 52,
      "previous": 47,
      "delta": 5,
      "deltaPercentage": 10.64
    },
    "tasks.completed": {
      "current": 11,
      "previous": 9,
      "delta": 2,
      "deltaPercentage": 22.22
    },
    "finance.expense": {
      "current": 38500,
      "previous": 45200,
      "delta": -6700,
      "deltaPercentage": -14.82
    },
    "finance.income": {
      "current": 0,
      "previous": 0,
      "delta": 0,
      "deltaPercentage": null
    },
    "workouts.completed": {
      "current": 3,
      "previous": 4,
      "delta": -1,
      "deltaPercentage": -25
    }
  }
}
```

### 3. Reglas de cálculo

**Dimensiones soportadas** (mismas semánticas que US-142):

| Dimension            | Fuente                                                |
| -------------------- | ----------------------------------------------------- |
| `habits.completions` | `HabitRecord.completed=true` en rango                 |
| `tasks.completed`    | `Task.status='completada'` con `completedAt` en rango |
| `finance.expense`    | suma `Transaction.amount` con `type='EXPENSE'`        |
| `finance.income`     | suma `Transaction.amount` con `type='INCOME'`         |
| `workouts.completed` | `Workout.finishedAt` en rango                         |

**Cálculo de delta**

- `delta = current - previous`.
- `deltaPercentage = (delta / previous) * 100`, redondeado a 2 decimales.
- Si `previous === 0` → `deltaPercentage: null` (no inventar `Infinity` ni `100`).

**Optimización**

- Reusar las funciones del `analytics.service.ts` que ya calculan cada dimensión (definidas en US-142).
- Ejecutar agregaciones del período actual y previo en paralelo (`Promise.all`).

### 4. Errores

- `401`, `400` (validación Zod, incluyendo dimensiones desconocidas), `500` con Sentry.
- Si una dimensión solicitada no se puede calcular por datos faltantes, devolver con valores 0 y registrar warning en logs (no error).

---

## Tareas Técnicas

1. **Helper `compareDimensions(userId, current, previous, dimensions)`** — [1.5h]
2. **Manejo del warning header de longitudes desiguales** — [0.5h]
3. **Handler y ruta** — [0.5h]
4. **Tests unitarios de cálculo de delta (cubrir previous=0, negativos)** — [1.5h]
5. **Test de integración** — [1.5h]

---

## Definition of Done

- [ ] Endpoint en `/api/analytics/compare`
- [ ] `deltaPercentage` es `null` cuando `previous=0` (no `Infinity`)
- [ ] Warning header presente cuando rangos difieren en longitud
- [ ] Tests > 80% cobertura
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 4 SP | 5.5h
**Bloqueada por:** US-141, US-142
**Bloqueante de:** US-147
