# US-130: Endpoint para Finalizar Entrenamiento y Calcular Estadísticas

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 5
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** finalizar mi sesión de entrenamiento y ver un resumen
**Para** cerrar el workout y que se calculen mis estadísticas

---

## Criterios de Aceptación

### 1. PUT /api/workouts/:id/finish

**Request:**

```json
{
  "notes": "Buen entrenamiento, aumentar peso la próxima"
}
```

**Proceso:**

- [x] Validar: workout existe, pertenece al usuario, NO está finalizado
- [x] Actualizar: `endTime = now()`, `notes`
- [x] Calcular y retornar resumen:

**Response 200:**

```json
{
  "workout": {
    "id": "wo_123",
    "routineId": "rt_push",
    "startTime": "2025-10-22T14:00:00Z",
    "endTime": "2025-10-22T15:15:00Z",
    "duration": 75,
    "notes": "Buen entrenamiento..."
  },
  "summary": {
    "exercisesCompleted": 5,
    "totalSets": 18,
    "totalReps": 180,
    "totalVolume": 3250.5,
    "avgWeight": 52.3,
    "personalRecords": [
      {
        "exerciseId": "ex_sentadilla",
        "exerciseName": "Sentadilla",
        "newPR": 100,
        "previousPR": 95,
        "improvement": 5
      }
    ]
  }
}
```

**Cálculos:**

- [x] `duration`: (endTime - startTime) en minutos
- [x] `exercisesCompleted`: count de WorkoutExercise
- [x] `totalSets`: sum de WorkoutSet
- [x] `totalVolume`: Σ(reps × weight) de todos los sets
- [x] `avgWeight`: totalVolume / totalReps
- [x] **Personal Records:** para cada ejercicio, verificar si `max(weight)` > histórico

### 2. GET /api/workouts/:id

**Response:**

```json
{
  "id": "wo_123",
  "routineId": "rt_push",
  "routineName": "Push Day",
  "startTime": "2025-10-22T14:00:00Z",
  "endTime": "2025-10-22T15:15:00Z",
  "duration": 75,
  "notes": "...",
  "exercises": [
    {
      "id": "we_001",
      "exerciseId": "ex_press_banca",
      "exerciseName": "Press Banca",
      "muscleGroup": "Pecho",
      "order": 1,
      "rpe": 8,
      "notes": "Me costó la última serie",
      "sets": [
        {
          "setNumber": 1,
          "reps": 12,
          "weight": 60,
          "weightUnit": "kg",
          "completed": true,
          "restTime": 90,
          "timestamp": "2025-10-22T14:05:00Z"
        }
      ]
    }
  ],
  "summary": { ... }
}
```

### 3. GET /api/workouts - Historial

**Query params:**

- `?from=YYYY-MM-DD` (default: 30 días atrás)
- `?to=YYYY-MM-DD` (default: hoy)
- `?routineId={id}` (filtrar por rutina)

**Response 200:**

```json
{
  "workouts": [
    {
      "id": "wo_123",
      "routineId": "rt_push",
      "routineName": "Push Day",
      "startTime": "2025-10-22T14:00:00Z",
      "duration": 75,
      "exercisesCompleted": 5,
      "totalSets": 18,
      "totalVolume": 3250
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

## Tareas Técnicas

1. **Endpoint finish** - [1.5h]
2. **Cálculo de resumen** - [2h]
3. **Detección de PRs** - [1.5h]
4. **Endpoint GET con includes** - [1h]
5. **Endpoint list con filtros y paginación** - [1.5h]
6. **Tests** - [3.5h]

---

## Definition of Done

- [x] Código implementado
- [x] Cálculos correctos (validados)
- [x] Tests > 80% cobertura
- [x] Code review aprobado
- [x] Deploy a staging

---

**Estimación:** 5 SP | 11h
**Última actualización:** 2025-10-22
