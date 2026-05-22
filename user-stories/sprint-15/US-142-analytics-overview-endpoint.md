# US-142: Endpoint de Overview de Analytics

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 5
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** ver un resumen integral de mi actividad en un período
**Para** entender mi estado general (hábitos, tareas, finanzas, fitness, metas) en un vistazo

---

## Criterios de Aceptación

### 1. Endpoint

`GET /api/analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`

- Requiere `authMiddleware`.
- Valida query con `analyticsRangeQuerySchema` (US-141).
- Si faltan `from`/`to`, default = últimos 30 días (incluye hoy).
- Ventana máxima 366 días.

### 2. Response 200

```json
{
  "period": { "from": "2026-04-21", "to": "2026-05-21", "days": 31 },
  "habits": {
    "totalCompletions": 218,
    "uniqueHabitsCompleted": 12,
    "completionRate": 0.81,
    "longestStreakInPeriod": 28
  },
  "tasks": {
    "completed": 47,
    "pending": 9,
    "overdue": 3,
    "completionRate": 0.85
  },
  "finance": {
    "income": 250000,
    "expense": 187300,
    "net": 62700,
    "transactionCount": 64
  },
  "workouts": {
    "completed": 14,
    "totalVolume": 38400
  },
  "goals": {
    "active": 4,
    "completedInPeriod": 1,
    "averageProgress": 0.62
  }
}
```

### 3. Cálculos

**habits**

- `totalCompletions`: count de `HabitRecord` del usuario con `completed=true` y `date` en rango.
- `uniqueHabitsCompleted`: count distinct `habitId` con al menos una completitud.
- `completionRate`: `totalCompletions / esperadas`, donde esperadas = suma de instancias programadas según `periodicity` de cada hábito activo en el rango.
- `longestStreakInPeriod`: la racha más larga (consecutiva) detectada en cualquier hábito dentro del rango.

**tasks**

- `completed`: `status='completada'` y `completedAt` en rango.
- `pending`: `status` en `('pendiente','en_progreso')` a la fecha `to`.
- `overdue`: `pending` con `dueDate < to`.
- `completionRate`: `completed / (completed + overdue)` (evitar división por cero → 0).

**finance**

- `income`: suma de `Transaction.amount` con `type='INCOME'` en rango.
- `expense`: suma con `type='EXPENSE'`.
- `net`: `income - expense`.
- `transactionCount`: count de transacciones en rango.

**workouts**

- `completed`: `Workout` con `finishedAt` en rango.
- `totalVolume`: suma de `WorkoutSet.reps * WorkoutSet.weight` para sets de esos workouts.

**goals**

- `active`: goals del usuario con `status='active'`.
- `completedInPeriod`: goals con `status='completed'` y `completedAt` en rango.
- `averageProgress`: promedio del campo `progress` de las goals activas (0..1).

### 4. Performance

- p95 < 600ms con 1 año de datos cargados (~10k transacciones, ~5k habit records).
- Todas las queries deben aprovechar índices existentes (`userId`, `date`, `completedAt`).
- Ejecutar agregaciones en paralelo con `Promise.all`.

### 5. Errores

- `401` si no autenticado.
- `400` con detalle Zod si query inválida.
- `500` con logging en Sentry si falla la agregación.

---

## Tareas Técnicas

1. **Crear `analytics.controller.ts` con handler de overview** — [1h]
2. **Crear `analytics.service.ts` con funciones puras de agregación por dominio** — [3h]
3. **Crear `analytics.routes.ts` y registrarlo en `routes/index.ts`** — [0.5h]
4. **Resolver ventanas por defecto y validación** — [0.5h]
5. **Tests unitarios de `analytics.service.ts` (helpers de agregación)** — [2h]
6. **Test de integración del endpoint con Supertest** — [1.5h]
7. **Optimización de queries (índices, paralelización)** — [1h]

---

## Definition of Done

- [ ] Endpoint disponible en `/api/analytics/overview`
- [ ] Validación Zod activa
- [ ] Tests > 80% cobertura en `analytics.service.ts`
- [ ] Test de integración cubre 200, 400, 401
- [ ] p95 < 600ms en staging con datos de prueba
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 5 SP | 9.5h
**Bloqueada por:** US-141
**Bloqueante de:** US-147
