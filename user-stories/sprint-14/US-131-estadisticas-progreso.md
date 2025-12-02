# US-131: Endpoint de Estadísticas de Progreso

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 6
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** ver estadísticas de mi progreso en cada ejercicio y en general
**Para** analizar mi evolución y motivarme

---

## Criterios de Aceptación

### 1. GET /api/exercises/:id/stats?days=90

**Response:**

```json
{
  "exercise": {
    "id": "ex_sentadilla",
    "name": "Sentadilla",
    "muscleGroup": "Piernas"
  },
  "period": {
    "from": "2025-07-24",
    "to": "2025-10-22",
    "days": 90
  },
  "executions": {
    "timesExecuted": 24,
    "totalSets": 72,
    "totalReps": 720
  },
  "loadProgress": {
    "maxWeightAllTime": 100,
    "maxWeightPeriod": 100,
    "avgWeightPeriod": 87.5,
    "firstExecutionWeight": 80,
    "lastExecutionWeight": 100,
    "improvement": 25,
    "improvementPercentage": 31.25
  },
  "volume": {
    "totalVolume": 63000,
    "avgVolumePerSession": 2625
  },
  "chart": [
    {
      "date": "2025-10-01",
      "maxWeight": 95,
      "totalVolume": 2850,
      "totalSets": 3
    },
    {
      "date": "2025-10-05",
      "maxWeight": 97.5,
      "totalVolume": 2925,
      "totalSets": 3
    }
  ],
  "lastWorkout": {
    "date": "2025-10-22T14:00:00Z",
    "sets": [
      { "reps": 12, "weight": 100 },
      { "reps": 10, "weight": 100 },
      { "reps": 8, "weight": 100 }
    ],
    "rpe": 9,
    "notes": "Pesado pero controlado"
  }
}
```

### 2. GET /api/stats/overview?days=30

**Response:**

```json
{
  "period": {
    "from": "2025-09-22",
    "to": "2025-10-22",
    "days": 30
  },
  "workouts": {
    "completed": 12,
    "frequency": 2.8,
    "avgDuration": 58
  },
  "volume": {
    "total": 45600,
    "avgPerWorkout": 3800
  },
  "exercises": {
    "uniqueExercises": 15,
    "totalSets": 216
  },
  "topExercises": [
    {
      "exerciseId": "ex_sentadilla",
      "exerciseName": "Sentadilla",
      "count": 12,
      "totalVolume": 12600
    }
  ],
  "muscleGroupDistribution": [
    { "muscleGroup": "Piernas", "count": 36, "percentage": 33.3 },
    { "muscleGroup": "Pecho", "count": 30, "percentage": 27.8 }
  ],
  "weeklyFrequency": [
    { "week": "2025-W40", "workouts": 3, "totalVolume": 11400 },
    { "week": "2025-W41", "workouts": 3, "totalVolume": 11900 }
  ]
}
```

---

## Tareas Técnicas

1. **Endpoint stats por ejercicio** - [2.5h]
2. **Cálculos de progreso de carga** - [1.5h]
3. **Agrupación para gráficos** - [1.5h]
4. **Endpoint overview** - [2h]
5. **Cálculos de frecuencia y distribución** - [1.5h]
6. **Optimizar queries** - [1.5h]
7. **Tests** - [3h]

---

## Definition of Done

- [x] Código implementado
- [x] Cálculos correctos
- [x] Tests > 80% cobertura
- [x] Performance < 1s con 100+ workouts
- [x] Code review aprobado
- [x] Deploy a staging

---

**Estimación:** 6 SP | 13.5h
**Última actualización:** 2025-10-22
