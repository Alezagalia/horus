# US-145: Endpoint de Productividad por Día y Hora

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 5
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** descubrir en qué días de la semana y a qué horas soy más productivo
**Para** planificar mis tareas más exigentes en mis ventanas de mejor rendimiento

---

## Criterios de Aceptación

### 1. Endpoint

`GET /api/analytics/productivity?from=YYYY-MM-DD&to=YYYY-MM-DD`

- Requiere `authMiddleware`.
- Valida con `analyticsRangeQuerySchema` (US-141).
- Default: últimos 90 días.

### 2. Response 200

```json
{
  "period": { "from": "2026-02-20", "to": "2026-05-21", "days": 91 },
  "totalCompleted": 162,
  "byDayOfWeek": [
    { "dayOfWeek": 0, "completed": 12 },
    { "dayOfWeek": 1, "completed": 31 },
    { "dayOfWeek": 2, "completed": 28 },
    { "dayOfWeek": 3, "completed": 25 },
    { "dayOfWeek": 4, "completed": 30 },
    { "dayOfWeek": 5, "completed": 24 },
    { "dayOfWeek": 6, "completed": 12 }
  ],
  "byHourOfDay": [
    { "hour": 0, "completed": 1 },
    { "hour": 9, "completed": 18 },
    { "hour": 10, "completed": 22 }
  ],
  "heatmap": [
    { "dayOfWeek": 1, "hour": 9, "completed": 6 },
    { "dayOfWeek": 1, "hour": 10, "completed": 8 }
  ],
  "bestDayOfWeek": { "dayOfWeek": 1, "completed": 31 },
  "bestHour": { "hour": 10, "completed": 22 }
}
```

### 3. Reglas de cálculo

- **Fuente**: `Task.completedAt` de tareas con `status='completada'` y `completedAt` en el rango, del usuario autenticado.
- **`dayOfWeek`**: 0=domingo, 1=lunes, ..., 6=sábado. Calcular en zona horaria del usuario (campo `User.timezone` si existe; default `America/Argentina/Buenos_Aires`).
- **`hour`**: 0..23, hora local del usuario.
- **`byDayOfWeek`**: siempre 7 entradas (0..6), incluso si `completed=0`.
- **`byHourOfDay`**: solo horas con `completed > 0`, orden ascendente por `hour`.
- **`heatmap`**: solo celdas con `completed > 0` para mantener payload chico.
- **`bestDayOfWeek` / `bestHour`**: el de mayor `completed`. En empate gana el de mayor índice (más tarde en la semana / hora). `null` si `totalCompleted == 0`.

### 4. Performance

- p95 < 500ms con 1 año de tareas (~3k tareas completadas).
- Una sola query con `groupBy` o `$queryRaw` con `EXTRACT(DOW FROM ...)` y `EXTRACT(HOUR FROM ...)` en PostgreSQL aplicando timezone.

### 5. Consideraciones de timezone

- Si `User.timezone` no existe, agregar campo en Sprint futuro (US separada). Por ahora hardcodear `America/Argentina/Buenos_Aires` y dejar `// TODO: usar User.timezone` en el código.
- El cálculo de DOW/HOUR debe ocurrir en SQL aplicando el offset; **NO** convertir cada fila en JS (mata performance).

### 6. Errores

- `401`, `400` (validación Zod), `500` con Sentry.

---

## Tareas Técnicas

1. **Query agrupada con `EXTRACT` y conversión de timezone en PostgreSQL** — [2h]
2. **Mapeo a estructura `byDayOfWeek` / `byHourOfDay` / `heatmap`** — [1h]
3. **Detección de `bestDayOfWeek` y `bestHour`** — [0.5h]
4. **Handler y ruta** — [0.5h]
5. **Tests unitarios del mapeo** — [1.5h]
6. **Test de integración (incluir caso vacío)** — [1.5h]

---

## Definition of Done

- [ ] Endpoint en `/api/analytics/productivity`
- [ ] Cálculo respeta timezone (test con tarea completada a las 23:30 local cae en día correcto)
- [ ] Caso vacío devuelve `bestDayOfWeek: null` y `bestHour: null` sin error
- [ ] Tests > 80% cobertura
- [ ] p95 < 500ms en staging
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 5 SP | 7h
**Bloqueada por:** US-141
**Bloqueante de:** US-149
