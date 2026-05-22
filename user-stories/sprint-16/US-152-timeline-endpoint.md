# US-152: Endpoint /api/timeline con motor de hitos consolidados

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 16
**Story Points:** 8
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** ver una línea de tiempo cronológica de mis hitos a lo largo de toda mi historia en Horus
**Para** reconectar con mi pasado, ver mi evolución como narrativa y recibir aniversarios que me motiven

---

## Criterios de Aceptación

### 1. Endpoint

`GET /api/timeline?from=&to=&modules=&categories=&limit=&offset=`

- Requiere `authMiddleware`.
- Valida query con `timelineQuerySchema` (US-151).
- Defaults: sin `from`, `to`=hoy, todos los módulos, todas las categorías, `limit=100`, `offset=0`.

### 2. Response 200

```json
{
  "events": [
    {
      "id": "anniversary.habit.created.b8f1c3d2",
      "module": "habits",
      "category": "anniversary",
      "kind": "habit.created",
      "date": "2025-05-21",
      "title": "Hace 1 año empezaste el hábito Correr",
      "description": "Es tu aniversario con este hábito.",
      "entity": { "type": "habits", "id": "b8f1c3d2", "name": "Correr" },
      "anniversary": { "yearsAgo": 1 }
    },
    {
      "id": "first.workout.a4d8e",
      "module": "workouts",
      "category": "first",
      "kind": "workout.first",
      "date": "2025-04-12",
      "title": "Tu primer entrenamiento",
      "entity": { "type": "workouts", "id": "a4d8e" }
    },
    {
      "id": "milestone.tasks.100",
      "module": "tasks",
      "category": "milestone",
      "kind": "tasks.100",
      "date": "2025-08-30",
      "title": "100 tareas completadas"
    }
  ],
  "total": 47,
  "hasMore": false
}
```

### 3. Motor de hitos — reglas por categoría

**`first.*`** — Primera vez:

- `habit.created`: primer Habit del usuario (orden por `createdAt`)
- `task.created`: primera Task
- `task.completed`: primera Task con `status='completada'`
- `workout.first`: primer Workout con `endTime != null`
- `goal.created`: primer Goal
- `account.created`: primera Account
- `transaction.first`: primera Transaction (no transfer)
- `resource.created`: primer Resource

**`completed.*`** — Hitos de cierre:

- `goal.completed`: cada Goal con `status='completada'` y `completedAt`
- `habit.streak.30`: primera vez que un Habit alcanza `longestStreak >= 30`
- `habit.streak.60`: ídem para 60
- `habit.streak.90`: ídem para 90
- `habit.perfect-month`: primer mes calendario en que todos los hábitos activos tuvieron 100% de adherencia

**`anniversary.*`** — Aniversarios exactos a la fecha de hoy:

- Para cada `first.*`, generar evento si:
  - `monthsAgo` ∈ {1, 3, 6} (mes exacto)
  - `yearsAgo` ∈ {1, 2, 3, 4, 5, ...}
- Misma regla para `goal.completed` (sólo años, no meses)
- Misma regla para `habit.streak.30/60/90`

**`milestone.*`** — Números redondos acumulados:

- `tasks.100`, `tasks.500`, `tasks.1000`, ...
- `habits.completions.500`, `habits.completions.1000`, ...
- `workouts.10`, `workouts.50`, `workouts.100`, ...

Para los milestones se busca la fecha exacta en que se cruzó el umbral (la N-ésima entry).

### 4. Reglas comunes

- Eventos ordenados desc por `date` (más reciente primero).
- Aplicar filtros `modules` y `categories` antes de paginar.
- Aplicar filtro de rango `from`/`to` sobre `date`.
- `total` refleja el conteo completo después de filtros; `hasMore` indica si quedan páginas.
- `id` es estable y único — útil para keys de React.
- Textos `title`/`description` en español argentino.

### 5. Performance

- p95 < 1.5s con 1 año de historia activa.
- Una sola pasada por dominio: pedir los registros relevantes (no toda la historia) y construir los eventos en memoria.
- Para milestones: usar `count + select limit` no traer todo.

### 6. Errores

- `401` no autenticado.
- `400` con detalles Zod si query inválida.
- `500` con logging en Sentry.

---

## Tareas Técnicas

1. **Esqueleto `timeline.service.ts` + tipos internos** — [1h]
2. **Detectores `first.*` por dominio** — [2h]
3. **Detectores `completed.*` (incluye perfect-month que es complejo)** — [2.5h]
4. **Generador de `anniversary.*` a partir de los eventos primarios** — [1.5h]
5. **Detectores `milestone.*` con N-ésima entry por umbral** — [2h]
6. **Controller + ruta + registro en `routes/index.ts`** — [1h]
7. **Test de integración del endpoint con Supertest** — [2h]

---

## Definition of Done

- [ ] Endpoint disponible en `/api/timeline`
- [ ] Reglas de `first/completed/anniversary/milestone` implementadas
- [ ] Validación Zod activa, errores 400 informativos
- [ ] p95 < 1.5s en staging con datos de prueba
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 8 SP | 12h
**Bloqueada por:** US-151
**Bloqueante de:** US-153, US-154
